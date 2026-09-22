/**
 * The background.js service gets launched by chrome's background process when a timer is about to fire
 * It's basically a minimalist implementation of DuckieTV's favorites update mechanism.
 *
 * The way this works is simple:
 * A timer launches an event channel at a given time
 * It broadcasts a message on a channel something is listening for (for instance favorites:update, which triggers the FavoritesService)
 * After that the page gets torn down again to reduce memory footprint.
 *
 */

/**
 * Make sure migrations don't run on the latest versions.
 */
chrome.runtime.onInstalled.addListener(function(details) {
  localStorage.setItem('runtime.event', JSON.stringify(details))
  if (details.reason == 'install') {
    console.info('This is a first install!')
    localStorage.setItem('install.notify', chrome.runtime.getManifest().version)
    /*
         * example: localStorage.setItem('0.54.createtimers', 'done');
         */
  } else if (details.reason == 'update') {
    var thisVersion = chrome.runtime.getManifest().version
    console.info('Updated from ' + details.previousVersion + ' to ' + thisVersion + '!')
    if (details.previousVersion != thisVersion) {
      localStorage.setItem('install.notify', thisVersion)
    }
  }
})

/**
 * Listen for incoming CRUD.js queries coming from the BackgroundPageAdapter
 * This adapter opens a channel to the background page and forwards all queries here to be executed.
 *
 *
 */
chrome.runtime.onConnect.addListener(function(port) {
  CRUD.log('New incoming connection from foreground page')
  if (port.name != 'CRUD') return

  port.onMessage.addListener(function(msg) {
    CRUD.log(msg.command + ' Message received from foreground page ', msg)
    Promise.resolve(window.DuckieTVStorageReady).then(function() {
      return handleCommand(msg)
    }).then(function(result) {
      if (!port.disconnected) port.postMessage({ guid: msg.guid, result: result })
    }).catch(function(error) {
      console.error('Background database command failed', error, msg.command)
      if (!port.disconnected) port.postMessage({ guid: msg.guid, error: serializeError(error) })
    })
  })

  port.onDisconnect.addListener(function() {
    CRUD.log('Port disconnected')
    port.disconnected = true
  })

  function handleCommand(msg) {
    switch (msg.command) {
      case 'ready':
        return { ready: true }
      case 'Find':
        return CRUD.Find(msg.what, msg.filters, msg.options)
      case 'Persist':
        var persisted = CRUD.fromCache(msg.type, msg.values)
        var isNew = msg.ID === false
        if (!isNew) persisted.__values__[CRUD.EntityManager.getPrimary(msg.type)] = msg.ID
        return persisted.Persist().then(function() {
          return { ID: persisted.getID(), Action: isNew ? 'inserted' : 'updated' }
        })
      case 'Delete':
        var deleted = CRUD.fromCache(msg.type, msg.values || {})
        deleted.__values__[CRUD.EntityManager.getPrimary(msg.type)] = msg.ID
        return deleted.Delete()
      case 'query':
        return CRUD.executeQuery(msg.sql, msg.params)
      case 'shutdown':
        return window.DuckieTVStorageShutdown().then(function() { return { closed: true } })
      default:
        return Promise.reject(new Error('Unknown background database command: ' + msg.command))
    }
  }

  function serializeError(error) {
    return {
      message: String(error && (error.message || error)),
      code: error && error.code,
      stack: error && error.stack
    }
  }
})
