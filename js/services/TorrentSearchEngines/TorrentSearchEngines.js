/**
 * Registry for native and Jackett providers, and the shared entry point for
 * submitting torrent links. Providers implement search and may resolve links
 * from a result's details page. Manual search and Auto Download share the
 * registry and select providers independently.
 */

DuckieTV.factory('TorrentSearchEngines', ['$rootScope', '$q', '$http', '$injector', 'DuckieTorrent', 'dialogs', 'SettingsService', 'SceneNameResolver', 'TorrentHashListService',
  function($rootScope, $q, $http, $injector, DuckieTorrent, dialogs, SettingsService, SceneNameResolver, TorrentHashListService) {
    var activeEngines = {}

    var nativeEngines = {}

    var jackettEngines = {}

    var defaultEngineName = 'ThePirateBay'

    var templateName = 'templates/dialogs/torrent.html'

    var dialogCtrl = 'torrentDialogCtrl'

    if (SettingsService.get('torrentDialog.2.enabled')) {
      templateName = 'templates/dialogs/torrent2.html'
      dialogCtrl = 'torrentDialog2Ctrl'
    }

    function openUrl(id, url) {
      // revert back to using iframe, https://github.com/SchizoDuckie/DuckieTV/issues/1308
/*      if (SettingsService.isStandalone() && id === 'magnet') {
        // for standalone, open magnet url direct to os https://github.com/SchizoDuckie/DuckieTV/issues/834
        nw.Shell.openExternal(url)
        // console.debug("Open via OS", id, url);
      } else {*/
        // for chrome extension, open url on chromium via iframe
        var d = document.createElement('iframe')
        d.id = id + 'url_' + new Date().getTime()
        d.style.visibility = 'hidden'
        d.src = url
        document.body.appendChild(d)
         if (window.debugTSE) console.debug("Open via Chromium", d.id, url)
        var dTimer = setInterval(function() {
          var dDoc = d.contentDocument || d.contentWindow.document
          if (dDoc.readyState == 'complete') {
            document.body.removeChild(d)
            clearInterval(dTimer)
            return
          }
        }, 1500)
//      }
    }

    // Notify listeners for the episode or dialog channel and for all selections.
    function recordSelection(infoHash, TRAKT_ID) {
      $rootScope.$broadcast('torrent:select:' + TRAKT_ID, infoHash)
      $rootScope.$broadcast('torrent:select', TRAKT_ID, infoHash)
      TorrentHashListService.addToHashList(infoHash)
    }

    /**
     * Record the hash after the client adapter reports success. Adapters differ
     * in their success values, but an explicit false or null means rejection.
     * The later list refresh supplies progress and cannot undo an accepted add.
     */
    function afterClientAdd(client, request, infoHash, TRAKT_ID) {
      return $q.when(request).then(function(result) {
        if (result === false || result === null) throw new Error('Torrent client rejected the download')
        recordSelection(infoHash, TRAKT_ID)
        setTimeout(function() {
          $q.when().then(function() { return client.Update(true) }).catch(function() {
            console.warn('Could not refresh the torrent list after adding a download')
          })
        }, 1500)
        return client.getName() === 'None' ? 'handed-off' : 'accepted'
      })
    }

    var service = {

      // list of common current trackers for SE that don't provide any on their magnets (1337x, IsoHunt, Idope, LimeTorrents, TorrentZ2)
      trackers: '',

      // cache of DB jackett elements
      jackettCache: [],

      // return DB jackett element from cache by name
      getJackettFromCache: function(name) {
        return service.jackettCache.filter(function(el) {
          return el.name == name
        })[0]
      },

      // delete DB jackett element from cache
      removeJackettFromCache: function(name) {
        var jackett = service.getJackettFromCache(name)
        if (jackett) {
          service.jackettCache = service.jackettCache.filter(function(el) {
            return el.getID() != jackett.getID()
          })
        }
      },

      // register native SE (and disable jackett SE of same name)
      registerSearchEngine: function(name, implementation) {
        if (name in jackettEngines) {
          var jackett = service.getJackettFromCache(name)
          jackett.setDisabled()
          jackettEngines[name].enabled = false
          console.info('Jackett Engine %s disabled.', name)
        }
        implementation.enabled = true
        implementation.config.name = name
        activeEngines[name] = nativeEngines[name] = implementation
        name in activeEngines ? console.info('Updating torrent search engine', name) : console.info('Registering torrent search engine:', name)
      },

      // register jackett SE (and disable native SE of same name)
      registerJackettEngine: function(name, implementation) {
        if (name in nativeEngines) {
          nativeEngines[name].enabled = false
          console.info('torrent Engine %s disabled.', name)
        }
        implementation.enabled = true
        activeEngines[name] = jackettEngines[name] = implementation
        name in activeEngines ? console.info('Updating Jackett search engine', name) : console.info('Registering Jackett search engine:', name)
      },

      // add jackett SE from DB jackett element (add to cache, and register it if enabled)
      addJackettEngine: function(jackett) {
        var config = JSON.parse(jackett.json)
        var engine = new GenericTorrentSearchEngine(config, $q, $http, $injector)
        engine.testOK = true
        engine.testMessage = ''
        engine.testing = false
        engine.enabled = false
        jackettEngines[jackett.name] = engine
        if (jackett.isEnabled()) {
          engine.enabled = true
          console.log('Jackett search engine loaded and added to activeEngines: ', jackett.name)
          if (jackett.name in activeEngines) {
            console.warn('Jackett engine %s overrides built-in search engine with the same name.', jackett.name)
          }
          service.registerJackettEngine(jackett.name, engine)
        }
        service.jackettCache.push(jackett)
      },

      // return all active engines (both native and jackett)
      getSearchEngines: function() {
        return activeEngines
      },

      // return active SE by name
      getSearchEngine: function(name) {
        if (name in activeEngines) {
          return activeEngines[name]
        } else {
          console.warn('search provider %s not found. default %s provider used instead.', name, defaultEngineName)
          return activeEngines[defaultEngineName]
        }
      },

      /**
       * Resolve the active providers in priority order. Prefer the show's
       * override and the saved list, then fall back to the legacy multi-provider
       * or single-provider settings. Each registered provider appears at most once.
       */
      getAutoDownloadProviders: function(showProvider) {
        var configured = SettingsService.get('autodownload.providers')
        var names
        if (Array.isArray(configured) && configured.length) {
          names = [showProvider].concat(configured)
        } else if (SettingsService.get('autodownload.multiSE.enabled')) {
          var legacy = SettingsService.get('autodownload.multiSE') || {}
          names = [showProvider, defaultEngineName].concat(Object.keys(legacy).filter(function(name) { return legacy[name] }))
        } else {
          var hasOverride = Object.prototype.hasOwnProperty.call(activeEngines, showProvider)
          names = [hasOverride ? showProvider : defaultEngineName]
        }
        return Array.from(new Set(names)).filter(function(name) {
          return typeof name === 'string' && Object.prototype.hasOwnProperty.call(activeEngines, name)
        })
      },

      // return all native SEs
      getNativeEngines: function() {
        return nativeEngines
      },

      // return the default search engine
      getDefaultEngine: function() {
        return activeEngines[defaultEngineName]
      },

      // return the default search engine name
      getDefaultEngineName: function() {
        return defaultEngineName
      },

      // return all jackett SEs
      getJackettEngines: function() {
        return jackettEngines
      },

      // return a jackett SE by name
      getJackettEngine: function(name) {
        return jackettEngines[name]
      },

      // set the default SE by name
      setDefault: function(name) {
        if (name !== defaultEngineName && name in activeEngines) {
          defaultEngineName = name
          $rootScope.$evalAsync() // Startup can resolve the configured default outside Angular.
        }
      },

      // delete a jackett engine (from everywhere)
      removeJackettEngine: function(engine) {
        delete jackettEngines[engine.config.name]
        if (engine.enabled) {
          delete activeEngines[engine.config.name]
        }
        var jackett = service.getJackettFromCache(engine.config.name)
        if ('Delete' in jackett) {
          jackett.Delete().then(function() {
            service.jackettCache = service.jackettCache.filter(function(el) {
              return el.getID() != jackett.getID()
            })
            console.info("Jackett '" + jackett.name + "' deleted.")
          })
        }
      },

      // disable active SE (and if jackett then enable native SE of same name)
      disableSearchEngine: function(engine) {
        delete activeEngines[engine.config.name]
        if ('isJackett' in engine.config && engine.config.isJackett) {
          var jackett = service.getJackettFromCache(engine.config.name)
          jackett.setDisabled()
          jackettEngines[engine.config.name].enabled = false
          console.info('Jackett Engine %s disabled.', engine.config.name)
          if (engine.config.name in nativeEngines) {
            service.enableSearchEngine(nativeEngines[engine.config.name])
          }
        } else {
          nativeEngines[engine.config.name].enabled = false
          console.info('torrent Engine %s disabled.', engine.config.name)
        }
      },

      // enable SE (either jackett or native)
      enableSearchEngine: function(engine) {
        if ('isJackett' in engine.config && engine.config.isJackett) {
          service.registerJackettEngine(engine.config.name, engine)
          var jackett = service.getJackettFromCache(engine.config.name)
          jackett.setEnabled()
        } else {
          service.registerSearchEngine(engine.config.name, engine)
        }
      },

      /**
       * Resolve the episode query and return the dialog handle. The caller may
       * supply a selection channel for a local row without a Trakt ID.
       */
      findEpisode: function(serie, episode, selectionChannel = episode.TRAKT_ID) {
        return SceneNameResolver.getSearchStringForEpisode(serie, episode).then(function(searchString) {
          return dialogs.create(templateName, dialogCtrl, {
            query: searchString,
            TRAKT_ID: selectionChannel,
            serie: serie,
            episode: episode
          }, {
            size: 'lg'
          })
        })
      },

      search: function(query, TRAKT_ID, options) {
        return dialogs.create(templateName, dialogCtrl, {
          query: query,
          TRAKT_ID: TRAKT_ID
        }, options || {
          size: 'lg'
        })
      },
      openExternalLink: openUrl,

      /**
       * Submit a magnet through the connected client or hand it to Chromium.
       * A resolved 'handed-off' result means the link was opened. Only
       * 'accepted' means a managed client reported success.
       */
      launchMagnet: function(magnet, TRAKT_ID, dlPath, label) {
        var client = DuckieTorrent.getClient()
        var infoHash = magnet.getInfoHash()
        if (!SettingsService.get('torrenting.launch_via_chromium') && client.isConnected()) {
          return afterClientAdd(client, client.addMagnet(magnet, dlPath, label), infoHash, TRAKT_ID)
        }
        openUrl('magnet', magnet)
        recordSelection(infoHash, TRAKT_ID)
        return $q.when('handed-off')
      },

      launchTorrentByUpload: function(data, infoHash, TRAKT_ID, releaseName, dlPath, label) {
        var client = DuckieTorrent.getClient()
        if (!client.isConnected()) throw new Error('Torrent client is disconnected')
        return afterClientAdd(client, client.addTorrentByUpload(data, infoHash, releaseName, dlPath, label), infoHash, TRAKT_ID)
      },

      launchTorrentByURL: function(torrentUrl, infoHash, TRAKT_ID, releaseName, dlPath, label) {
        var client = DuckieTorrent.getClient()
        if (!SettingsService.get('torrenting.launch_via_chromium') && client.isConnected()) {
          return afterClientAdd(client, client.addTorrentByUrl(torrentUrl, infoHash, releaseName, dlPath, label), infoHash, TRAKT_ID)
        }
        openUrl('torrent', torrentUrl)
        recordSelection(infoHash, TRAKT_ID)
        return $q.when('handed-off')
      },

      /**
       * Fetch and decode a torrent once, then submit it and return its status
       * and hash. Errors carry a 'source' or 'client' stage so Auto Download
       * can tell whether it is safe to try another provider.
       */
      launchFromTorrentUrl: async function(url, TRAKT_ID, releaseName, dlPath, label) {
        var stage = 'source'
        try {
          var response = await $http.get(url, { responseType: 'blob' })
          var decoded = await new Promise(function(resolve, reject) {
            window.parseTorrent.remote(response.data, function(error, torrent) {
              if (error) reject(error)
              else resolve(torrent)
            })
          })
          var infoHash = decoded.infoHash.getInfoHash()
          if (!infoHash) throw new Error('Missing torrent hash')

          stage = 'client'
          var client = DuckieTorrent.getClient()
          var request
          if (SettingsService.get('torrenting.launch_via_chromium') || !client.isConnected()) {
            request = service.launchTorrentByURL(url, infoHash, TRAKT_ID, releaseName, dlPath, label)
          } else {
            try {
              request = service.launchTorrentByUpload(response.data, infoHash, TRAKT_ID, releaseName, dlPath, label)
            } catch (error) {
              // A synchronous unsupported-upload error occurs before submission.
              // Await the request outside this fallback to avoid a second add.
              if (!/not implemented/i.test(String(error))) throw error
              request = service.launchTorrentByURL(url, infoHash, TRAKT_ID, releaseName, dlPath, label)
            }
          }
          return { status: await request, infoHash: infoHash }
        } catch (error) {
          var failure = new Error('Torrent ' + stage + ' failed')
          failure.stage = stage
          throw failure
        }
      },

      initialize: function() {
        var lastFetched = ('trackers.lastFetched' in localStorage) ? new Date(parseInt(localStorage.getItem('trackers.lastFetched'))) : new Date()
        if (('trackers.fallBackList' in localStorage) && lastFetched.getTime() + 2592000000 > new Date().getTime()) {
          // its not been 30 days since the last update, use existing trackers fall back list
          service.trackers = localStorage.getItem('trackers.fallBackList')
          console.info('Fetched trackers fall back list from localStorage.')
        } else {
          // its been 30 days since the last update, time to refresh
          $http.get('https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_best.txt').then(function(response) {
            // prefix each tracker url with &tr= and strip CRLFs
            var rawTrackers = response.data.split(/\n\n/)
            service.trackers = rawTrackers.map(function(url) {
              return (url) ? '&tr=' + url : ''
            }).join('')
            localStorage.setItem('trackers.fallBackList', service.trackers)
            localStorage.setItem('trackers.lastFetched', new Date().getTime())
            console.info('Updated localStorage with latest trackers fall back list.')
          }, function(error) {
            // oops, something when wrong. provide default if there is no previous save
            if ('trackers.fallBackList' in localStorage) {
              service.trackers = localStorage.getItem('trackers.fallBackList')
              console.warn('Failed to fetch latest trackers fall back list, keeping previous.', error.status, error.statusText)
            } else {
              service.trackers = [
                '&tr=udp://tracker.opentrackr.org:1337/announce',
                '&tr=udp://open.tracker.cl:1337/announce',
                '&tr=udp://open.demonii.com:1337/announce',
                '&tr=udp://open.stealth.si:80/announce',
                '&tr=udp://tracker.torrent.eu.org:451/announce',
                '&tr=udp://exodus.desync.com:6969/announce',
                '&tr=udp://tracker1.bt.moack.co.kr:80/announce',
                '&tr=udp://tracker.theoks.net:6969/announce',
                '&tr=udp://explodie.org:6969/announce',
                '&tr=udp://tracker-udp.gbitt.info:80/announce'
              ].join('')
              localStorage.setItem('trackers.fallBackList', service.trackers)
              console.warn('Failed to fetch latest trackers fall back list, saving default.', error.status, error.statusText)
            }
          })
        }
        // load jackett engines
        CRUD.Find('Jackett').then(function(results) {
          results.map(function(jackett) {
            service.addJackettEngine(jackett)
          })
        })
      }
    }
    return service
  }
])
  .run(['TorrentSearchEngines', 'SettingsService',
    function(TorrentSearchEngines, SettingsService) {
      TorrentSearchEngines.initialize()
      TorrentSearchEngines.setDefault(SettingsService.get('torrenting.searchprovider'))
      if (SettingsService.get('torrenting.enabled')) {
        var timeoutDelay = 2000 // optional customisation for #1062
        if (localStorage.getItem('custom_default_SE_providers_delay')) {
          timeoutDelay = localStorage.getItem('custom_default_SE_providers_delay')
        }

        // delay for 2 second so that custom clients can register themselves before determining default engine.
        setTimeout(function() {
          var providers = TorrentSearchEngines.getSearchEngines()
          if (!(SettingsService.get('torrenting.searchprovider') in providers)) {
            // auto-config migration, fallback to first provider in the list when we detect an invalid provider.
            console.warn('Invalid search provider detected: ', SettingsService.get('torrenting.searchprovider'), ' defaulting to ', Object.keys(providers)[0])
            SettingsService.set('torrenting.searchprovider', Object.keys(providers)[0])
          }
          TorrentSearchEngines.setDefault(SettingsService.get('torrenting.searchprovider'))
        }, timeoutDelay)
      }
    }
  ])
