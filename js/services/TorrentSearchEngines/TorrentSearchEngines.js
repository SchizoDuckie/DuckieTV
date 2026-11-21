/**
 * Abstraction layer for the different torrent search engines that DuckieTV supports.
 * Search engines register themselves in the app's .run() block using TorrentSearchEngines.registerEngine(name, instance)
 *
 * All an engine needs to provide is a .search method. It can be both an angular factory or a plain old javascript instantiated function
 * The TorrentDialog directive lists these search engines and can switch between them.
 * The AutoDownloadService uses the default engine to look for torrents on aired episodes.
 *
 * There is a GenericTorrentSearchEngine.js in this folder that can scrape a lot of torrent sites by just passing in some endpoints and css selectors.
 * @see GenericTorrentSearch for more info or browse through the other torrent clients in this folder.
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

    function recordSelection(infoHash, TRAKT_ID) {
      $rootScope.$broadcast('torrent:select:' + TRAKT_ID, infoHash)
      TorrentHashListService.addToHashList(infoHash)
    }

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
        if (name in activeEngines) {
          defaultEngineName = name
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

      findEpisode: function(serie, episode) {
        return SceneNameResolver.getSearchStringForEpisode(serie, episode).then(function(searchString) {
          return dialogs.create(templateName, dialogCtrl, {
            query: searchString,
            TRAKT_ID: episode.TRAKT_ID,
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
        return $q.when('handed-off')
      },

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
