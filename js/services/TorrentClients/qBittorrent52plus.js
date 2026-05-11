/**
 * qBittorrent52plus >= 5.2 client
 *
 * API Docs:
 * https://github.com/qbittorrent/qBittorrent/wiki/Web-API-Documentation v5.2+ APIv2 (To be provided?)
 * https://github.com/qbittorrent/qBittorrent/wiki/API-Key-Authentication-(%E2%89%A5v5.2.0)
 *
 */
var qBittorrentData = function(data) {
  this.update(data)
}

qBittorrentData.extends(TorrentData, {
  getName: function() {
    return this.name
  },
  getDownloadSpeed: function() {
    return this.dlspeed // Bytes/second
  },
  getProgress: function() {
    return this.round(this.progress * 100, 1)
  },
  start: function() {
    this.getClient().getAPI().execute('resume', this.hash)
  },
  stop: function() {
    this.pause()
  },
  pause: function() {
    this.getClient().getAPI().execute('pause', this.hash)
  },
  remove: function() {
    this.getClient().getAPI().remove(this.hash)
  },
  getFiles: function() {
    var self = this
    return this.getClient().getAPI().getFiles(this.hash).then(function(results) {
      self.files = results
      return results
    })
  },
  getDownloadDir: function() {
    return this.files.downloaddir
  },
  isStarted: function() {
    return ['downloading', 'uploading', 'stalledDL', 'stalledUP'].indexOf(this.state) > -1
  }
})

/**
 * qBittorrent client
 */
DuckieTorrent.factory('qBittorrentRemote', ['BaseTorrentRemote',
  function(BaseTorrentRemote) {
    var qBittorrentRemote = function() {
      BaseTorrentRemote.call(this)
      this.dataClass = qBittorrentData
    }
    qBittorrentRemote.extends(BaseTorrentRemote)

    return qBittorrentRemote
  }
])

DuckieTorrent.factory('qBittorrent52plusAPI', ['BaseHTTPApi', '$http', '$q',
  function(BaseHTTPApi, $http, $q) {
    var qBittorrent52plusAPI = function() {
      BaseHTTPApi.call(this)
      this.config.apiVersion = 2
      this.config.apiSubVersion = 0
    }
    qBittorrent52plusAPI.extends(BaseHTTPApi, {
      login: function() {
        var self = this
        return $http.post(this.getUrl('version'), null, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Forwarded-Host': window.location.origin,
            'Authorization': 'Bearer ' + this.config.apikey
          }
        }).then(function(result) {
          if (result.data.startsWith('2.')) {
            if (window.debugTSE) console.debug('qBittorrent52plusAPI.login', result.data)
            var subs = result.data.split('.')
            self.config.apiSubVersion = subs[1]
            return true
          } else {
            if (window.debugTSE) console.debug('qBittorrent52plusAPI.login', result.data)
            throw 'Login failed!'
          }
        })
      },
      portscan: function() {
        var self = this
        return self.login().then(function() {
          return true
        }, function(err) {
          return false
        })
      },
      addMagnet: function(magnetHash, dlPath, label) {
        var self = this
        var fd = new FormData()
        fd.append('urls', magnetHash)
        if (dlPath !== undefined && dlPath !== null) {
          fd.append('savepath', dlPath)
        }
        if (label !== undefined && label !== null) {
          fd.append('category', label)
        }
        var headers = {
          'Content-Type': undefined,
          'X-Forwarded-Host': window.location.origin,
          'Authorization': 'Bearer ' + this.config.apikey
        }
        return $http.post(this.getUrl('addmagnet'), fd, {
          headers: headers
        }).then(function(result) {
          if (window.debugTSE) console.debug('qBittorrent52plusAPI.addmagnet', result.data)
        })
      },
      addTorrentByUpload: function(data, infoHash, releaseName, dlPath, label) {
        var self = this
        var headers = {
          'Content-Type': undefined,
          'X-Forwarded-Host': window.location.origin,
          'Authorization': 'Bearer ' + this.config.apikey
        }
        var fd = new FormData()
        fd.append('torrents', data, releaseName + '.torrent')

        if (dlPath !== undefined && dlPath !== null) {
          fd.append('savepath', dlPath)
        }
        if (label !== undefined && label !== null) {
          fd.append('category', label)
        }

        return $http.post(this.getUrl('addfile'), fd, {
          transformRequest: angular.identity,
          headers: headers
        }).then(function(result) {
          if (window.debugTSE) console.debug('qBittorrent52plusAPI.addTorrentByUpload', result.data)
          var currentTry = 0
          var maxTries = 5
          // wait for qBittorrent to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
          return $q(function(resolve, reject) {
            function verifyAdded() {
              currentTry++
              self.getTorrents().then(function(result) {
                var hash = null
                // for each torrent compare the torrent.hash with .torrent infoHash
                result.map(function(torrent) {
                  if (torrent.hash.toUpperCase() == infoHash) {
                    hash = infoHash
                  }
                })
                if (hash !== null) {
                  resolve(hash)
                } else {
                  if (currentTry < maxTries) {
                    setTimeout(verifyAdded, 1000)
                  } else {
                    throw 'Hash ' + infoHash + ' not found for torrent ' + releaseName + ' in ' + maxTries + ' tries.'
                  }
                }
              })
            }
            setTimeout(verifyAdded, 1000)
          })
        })
      },
      addTorrentByUrl: function(url, infoHash, releaseName) {
        var self = this
        return this.addMagnet(url).then(function(result) {
          var currentTry = 0
          var maxTries = 5
          // wait for qBittorrent to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
          return $q(function(resolve, reject) {
            function verifyAdded() {
              currentTry++
              self.getTorrents().then(function(result) {
                var hash = null
                // for each torrent compare the torrent.hash with .torrent infoHash
                result.map(function(torrent) {
                  if (torrent.hash.toUpperCase() == infoHash) {
                    hash = infoHash
                  }
                })
                if (hash !== null) {
                  resolve(hash)
                } else {
                  if (currentTry < maxTries) {
                    setTimeout(verifyAdded, 1000)
                  } else {
                    throw 'Hash ' + infoHash + ' not found for torrent ' + releaseName + ' in ' + maxTries + ' tries.'
                  }
                }
              })
            }
            setTimeout(verifyAdded, 1000)
          })
        })
      },
      /**
       * Supports setting the Download Path when adding magnets and .torrents.
       */
      isDownloadPathSupported: function() {
        return true
      },
      /**
       * Supports setting the Label when adding magnets and .torrents.
       */
      isLabelSupported: function() {
        return true
      },
      remove: function(magnetHash) {
        var self = this
        var fd = new FormData()
        fd.append('hashes', magnetHash)
        fd.append('deleteFiles', false)
        var headers = {
          'Content-Type': undefined,
          'X-Forwarded-Host': window.location.origin,
          'Authorization': 'Bearer ' + this.config.apikey
        }
        return $http.post(this.getUrl('remove'), fd, {
          headers: headers
        }).then(function(result) {
          if (window.debugTSE) console.debug('qBittorrent52plusAPI.remove', result.data)
        })
      },
      getTorrents: function() {
        var self = this
        var headers = {
          'Authorization': 'Bearer ' + this.config.apikey
        }
        return $http.get(this.getUrl('torrents'), {
          headers: headers
        }).then(function(data) {
          return data.data
        })
      },
      getFiles: function(hash) {
        if (hash == null) return
        var self = this
        var headers = {
          'Authorization': 'Bearer ' + this.config.apikey
        }
        return $http.get(this.getUrl('files', hash), {
          headers: headers
        }).then(function(data) {
          return $http.get(self.getUrl('general', hash), {
          headers: headers
        }).then(function(general) {
            data.data.downloaddir = (general.data.save_path) ? general.data.save_path.slice(0, -1) : undefined
            return data.data
          })
        })
      },
      execute: function(method, id) {
        var self = this
        var hashkey = 'hashes='
        if (self.config.apiSubVersion > 10)  {
          method = method + 'sub11'
        }
        var headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Forwarded-Host': window.location.origin,
          'Authorization': 'Bearer ' + this.config.apikey
        }
        return $http.post(this.getUrl(method), hashkey + id, {
          headers: headers
        })
      }
    })
    return qBittorrent52plusAPI
  }
])

  .factory('qBittorrent52plus', ['BaseTorrentClient', 'qBittorrentRemote', 'qBittorrent52plusAPI',
    function(BaseTorrentClient, qBittorrentRemote, qBittorrent52plusAPI) {
      var qBittorrent52plus = function() {
        BaseTorrentClient.call(this)
      }
      qBittorrent52plus.extends(BaseTorrentClient, {})

      var service = new qBittorrent52plus()
      service.setName('qBittorrent 5.2+')
      service.setAPI(new qBittorrent52plusAPI())
      service.setRemote(new qBittorrentRemote())
      service.setConfigMappings({
        server: 'qbittorrent52plus.server',
        port: 'qbittorrent52plus.port',
        apikey: 'qbittorrent52plus.apikey'
      })
      service.setEndpoints({
        torrents: '/api/v2/torrents/info',
        addmagnet: '/api/v2/torrents/add',
        addfile: '/api/v2/torrents/add',
        resume: '/api/v2/torrents/resume',
        resumesub11: '/api/v2/torrents/start',
        pause: '/api/v2/torrents/pause',
        pausesub11: '/api/v2/torrents/stop',
        remove: '/api/v2/torrents/delete',
        files: '/api/v2/torrents/files?hash=%s',
        general: '/api/v2/torrents/properties?hash=%s',
        version: '/api/v2/app/webapiVersion'
      })
      service.readConfig()

      return service
    }
  ])

  .run(['DuckieTorrent', 'qBittorrent52plus', 'SettingsService',
    function(DuckieTorrent, qBittorrent52plus, SettingsService) {
      if (SettingsService.get('torrenting.enabled')) {
        DuckieTorrent.register('qBittorrent 5.2+', qBittorrent52plus)
      }
    }
  ])
