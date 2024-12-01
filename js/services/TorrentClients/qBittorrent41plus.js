/**
 * qBittorrent41plus >= 4.1 client
 *
 * API Docs:
 * https://github.com/qbittorrent/qBittorrent/wiki/Web-API-Documentation v4.1+ APIv2 (appear to have been deleted)
 *
 */

DuckieTorrent.factory('qBittorrent41plusAPI', ['qBittorrentAPI', '$http', '$q',
  function(qBittorrentAPI, $http, $q) {
    var qBittorrent41plusAPI = function() {
      qBittorrentAPI.call(this)
      this.config.apiVersion = 2
      this.config.apiSubVersion = 0
    }
    qBittorrent41plusAPI.extends(qBittorrentAPI, {
      login: function() {
        var self = this
        return $http.post(this.getUrl('login'), 'username=' + encodeURIComponent(this.config.username) + '&password=' + encodeURIComponent(this.config.password), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Forwarded-Host': window.location.origin
          }
        }).then(function(result) {
          if (result.data == 'Ok.') {
            if (window.debugTSE) console.debug('qBittorrent41plusAPI.login', result.data)
            return self.request('version').then(function(result) {
              var subs = result.data.split('.')
              self.config.apiSubVersion = subs[1]
              return true
            })
          } else {
            if (window.debugTSE) console.debug('qBittorrent41plusAPI.login', result.data)
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
          'X-Forwarded-Host': window.location.origin
        }
        return $http.post(this.getUrl('addmagnet'), fd, {
          headers: headers
        }).then(function(result) {
          if (window.debugTSE) console.debug('qBittorrent41plusAPI.addmagnet', result.data)
        })
      },
      addTorrentByUpload: function(data, infoHash, releaseName, dlPath, label) {
        var self = this
        var headers = {
          'Content-Type': undefined,
          'X-Forwarded-Host': window.location.origin
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
          if (window.debugTSE) console.debug('qBittorrent41plusAPI.addTorrentByUpload', result.data)
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
          'X-Forwarded-Host': window.location.origin
        }
        return $http.post(this.getUrl('remove'), fd, {
          headers: headers
        }).then(function(result) {
          if (window.debugTSE) console.debug('qBittorrent41plusAPI.remove', result.data)
        })
      },
      getTorrents: function() {
        var self = this
        return this.request('torrents').then(function(data) {
          return data.data
        })
      },
      getFiles: function(hash) {
        var self = this
        return this.request('files', hash).then(function(data) {
          return self.request('general', hash).then(function(general) {
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
          'X-Forwarded-Host': window.location.origin
        }
        return $http.post(this.getUrl(method), hashkey + id, {
          headers: headers
        })
      }
    })
    return qBittorrent41plusAPI
  }
])

  .factory('qBittorrent41plus', ['BaseTorrentClient', 'qBittorrentRemote', 'qBittorrent41plusAPI',
    function(BaseTorrentClient, qBittorrentRemote, qBittorrent41plusAPI) {
      var qBittorrent41plus = function() {
        BaseTorrentClient.call(this)
      }
      qBittorrent41plus.extends(BaseTorrentClient, {})

      var service = new qBittorrent41plus()
      service.setName('qBittorrent 4.1+')
      service.setAPI(new qBittorrent41plusAPI())
      service.setRemote(new qBittorrentRemote())
      service.setConfigMappings({
        server: 'qbittorrent32plus.server',
        port: 'qbittorrent32plus.port',
        username: 'qbittorrent32plus.username',
        password: 'qbittorrent32plus.password',
        use_auth: 'qbittorrent32plus.use_auth'
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
        version: '/api/v2/app/webapiVersion',
        login: '/api/v2/auth/login'
      })
      service.readConfig()

      return service
    }
  ])

  .run(['DuckieTorrent', 'qBittorrent41plus', 'SettingsService',
    function(DuckieTorrent, qBittorrent41plus, SettingsService) {
      if (SettingsService.get('torrenting.enabled')) {
        DuckieTorrent.register('qBittorrent 4.1+', qBittorrent41plus)
      }
    }
  ])
