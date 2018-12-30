/**
 * None
 *
 * This is a dummy torrent client that responds as connected and returns as if all torrents are completed.
 * For use by those that either: are using an unsupported torrent client or don't want to connect to any of the existing ones.
 * This has the benefit of preventing unnecessary log clutter with failed connection attempts,
 * and allows other processes to complete successfully, such as marking a torrent as downloaded after the user launches a torrent manually.
 *
 */
var NoneData = function(data) {
  this.update(data)
}

NoneData.extends(TorrentData, {
  getName: function() {
    return this.name
  },
  getProgress: function() {
    return 100
  },
  getDownloadSpeed: function() {
    return 0 // Bytes/second
  },
  start: function() {
    return true
  },
  stop: function() {
    return true
  },
  pause: function() {
    return true
  },
  remove: function() {
    this.getClient().getAPI().remove(this.hash)
  },
  getDownloadDir: function() {
    return null
  },
  getFiles: function() {
    return this.getClient().getAPI().getFiles(this.hash).then(function(results) {
      this.files = results
      return results
    }.bind(this))
  },
  isStarted: function() {
    return false
  }
})

/**
 * None
 */
DuckieTorrent.factory('NoneRemote', ['BaseTorrentRemote',
  function(BaseTorrentRemote) {
    var NoneRemote = function() {
      BaseTorrentRemote.call(this)
      this.dataClass = NoneData
    }
    NoneRemote.extends(BaseTorrentRemote)

    return NoneRemote
  }
])

  .factory('NoneAPI', ['BaseHTTPApi', '$http', '$q', 'TorrentHashListService', 'SettingsService',
    function(BaseHTTPApi, $http, $q, TorrentHashListService, SettingsService) {
      var NoneAPI = function() {
        BaseHTTPApi.call(this)
      }
      NoneAPI.extends(BaseHTTPApi, {
        portscan: function() {
          return new Promise(function(resolve) {
            return resolve(true)
          })
        },
        getTorrents: function() {
          return new Promise(function(resolve) {
            var output = []
            Object.keys(TorrentHashListService.hashList).map(function(hash) {
              output.push({hash: hash, name: hash})
            })
            return resolve(output)
          })
        },
        getFiles: function() {
          return new Promise(function(resolve) {
            return resolve([])
          })
        },
        remove: function(hash) {
          return new Promise(function(resolve) {
            TorrentHashListService.removeFromHashList(hash)
            return resolve(true)
          })
        },
        addMagnet: function(magnetURI) {
          var self = this
          return new Promise(function(resolve) {
            self.openUrl('magnet', magnetURI)
            return resolve(true)
          })
        },
        addTorrentByUrl: function(torrentUrl, infoHash, releaseName) {
          var self = this
          return new Promise(function(resolve) {
            self.openUrl('torrent', torrentUrl)
            return resolve(infoHash)
          })
        },
        openUrl: function(id, url) {
          if (SettingsService.isStandalone() && id === 'magnet') {
            // for standalone, open magnet url direct to os https://github.com/SchizoDuckie/DuckieTV/issues/834
            nw.Shell.openExternal(url)
            // console.debug("Open via OS", id, url);
          } else {
            // for chrome extension, open url on chromium via iframe
            var d = document.createElement('iframe')
            d.id = id + 'url_' + new Date().getTime()
            d.style.visibility = 'hidden'
            d.src = url
            document.body.appendChild(d)
            // console.debug("Open via Chromium", d.id, url);
            var dTimer = setInterval(function() {
              var dDoc = d.contentDocument || d.contentWindow.document
              if (dDoc.readyState == 'complete') {
                document.body.removeChild(d)
                clearInterval(dTimer)
                return
              }
            }, 1500)
          }
        }
      })

      return NoneAPI
    }
  ])

  .factory('None', ['BaseTorrentClient', 'NoneRemote', 'NoneAPI',
    function(BaseTorrentClient, NoneRemote, NoneAPI) {
      var None = function() {
        BaseTorrentClient.call(this)
      }
      None.extends(BaseTorrentClient, {})

      var service = new None()
      service.setName('None')
      service.setAPI(new NoneAPI())
      service.setRemote(new NoneRemote())
      service.setConfigMappings({})
      service.setEndpoints({})
      service.readConfig()

      return service
    }
  ])

  .run(['DuckieTorrent', 'None', 'SettingsService',
    function(DuckieTorrent, None, SettingsService) {
      if (SettingsService.get('torrenting.enabled')) {
        DuckieTorrent.register('None', None)
      }
    }
  ])
