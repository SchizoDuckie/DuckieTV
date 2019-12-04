/**
 * qBittorrent32plus >= 3.2 client
 *
 * API Docs:
 * https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-Documentation v3.2.0-v4.0.4 APIv1
 * https://github.com/qbittorrent/qBittorrent/wiki/Web-API-Documentation v4.1+ APIv2
 *
 * - Supports setting download directory (After qBittorrent v3.3.1, using APIv1 subversion 7+)
 * - Supports setting label (After qBittorrent v3.3.1, using APIv1 subversion 7+)
 */

DuckieTorrent.factory('qBittorrent32plusAPI', ['qBittorrentAPI', '$http', '$q',
  function(qBittorrentAPI, $http, $q) {
    var qBittorrent32plusAPI = function() {
      qBittorrentAPI.call(this)
      this.config.apiVersion = 1 // lets assume the API is v1 to begin with
      this.config.apiSubVersion = 0
    }
    qBittorrent32plusAPI.extends(qBittorrentAPI, {
      login: function() {
        var self = this
        var method = (self.config.apiVersion == 2) ? 'loginv2' : 'login'
        return $http.post(this.getUrl(method), 'username=' + encodeURIComponent(this.config.username) + '&password=' + encodeURIComponent(this.config.password), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Forwarded-Host': window.location.origin
          }
        }).then(function(result) {
          if (result.data == 'Ok.') {
            if (window.debug982) console.debug('qBittorrent32plusAPI.login', result.data)
              if (self.config.apiVersion == 2) {
                return self.request('versionv2').then(function(result) {
                  var subs = result.data.split('.')
                  self.config.apiSubVersion = subs[1]
                  return true
                })
              }
            return true
          } else {
            if (window.debug982) console.debug('qBittorrent32plusAPI.login', result.data)
            throw 'Login failed!'
          }
        })
      },
      portscan: function() {
        var self = this
        if (self.config.apiVersion == 2) {
          // APIv2 requires a login before any other calls are made
          return self.login().then(function() {
            return true
          })
        } else {
          // APIv1 allows us to poll for port then login when found
          return this.request('version').then(function(result) {
            self.config.apiSubVersion = result.data
            return self.login().then(function() {
              return true
            })
          }, function(err) {
            if (err.status == 404) {
              // method not found? lets try APIv2
              self.config.apiVersion = 2
            }
            return false
          })
        }
      },
      addMagnet: function(magnetHash, dlPath, label) {
        var self = this
        var method = (self.config.apiVersion == 2) ? 'addmagnetv2' : 'addmagnet'
        if ((self.config.apiVersion == 2)  || ((self.config.apiVersion == 1) && (self.config.apiSubVersion > 6))) {
          // APIv2 or APIv1 sub > 6
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
          return $http.post(this.getUrl(method), fd, {
            headers: headers
          }).then(function(result) {
            if (window.debug982) console.debug('qBittorrent32plusAPI.addmagnet', result.data)
          })
        } else {
          // APIv1 sub < 7
          var headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
          return $http.post(this.getUrl(method), 'urls=' + encodeURIComponent(magnetHash), {
            headers: headers
          })
        }
      },
      addTorrentByUpload: function(data, infoHash, releaseName, dlPath, label) {
        var self = this
        var method = (self.config.apiVersion == 2) ? 'addfilev2' : 'addfile'
        var headers = {
          'Content-Type': undefined,
          'X-Forwarded-Host': window.location.origin
        }
        var fd = new FormData()
        fd.append('torrents', data, releaseName + '.torrent')

        if ((self.config.apiVersion == 2)  || ((self.config.apiVersion == 1) && (self.config.apiSubVersion > 6))) {
          // APIv2 or APIv1 sub > 6
          if (dlPath !== undefined && dlPath !== null) {
            fd.append('savepath', dlPath)
          }
          if (label !== undefined && label !== null) {
            fd.append('category', label)
          }
        }

        return $http.post(this.getUrl(method), fd, {
          transformRequest: angular.identity,
          headers: headers
        }).then(function(result) {
          if (window.debug982) console.debug('qBittorrent32plusAPI.addTorrentByUpload', result.data)
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
       * qBittorrent APIv2 or APIv1 sub > 6 supports setting the Download Path when adding magnets and .torrents.
       */
      isDownloadPathSupported: function() {
        var self = this
        return ((self.config.apiVersion == 2)  || ((self.config.apiVersion == 1) && (self.config.apiSubVersion > 6)))
      },
      /**
       * qBittorrent APIv2 or APIv1 sub > 6 supports setting the Label when adding magnets and .torrents.
       */
      isLabelSupported: function() {
        var self = this
        return ((self.config.apiVersion == 2)  || ((self.config.apiVersion == 1) && (self.config.apiSubVersion > 6)))
      },
      remove: function(magnetHash) {
        var self = this
        if (self.config.apiVersion == 2) {
          return this.request('removev2', magnetHash)
        } else {
          return $http.post(this.getUrl('remove'), 'hashes=' + encodeURIComponent(magnetHash), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Forwarded-Host': window.location.origin
            }
          })
        }
      },
      getTorrents: function() {
        var self = this
        var method = (self.config.apiVersion == 2) ? 'torrentsv2' : 'torrents'
        return this.request(method).then(function(data) {
          return data.data
        })
      },
      getFiles: function(hash) {
        var self = this
        var method = (self.config.apiVersion == 2) ? 'filesv2' : 'files'
        return this.request(method, hash).then(function(data) {
          var method = (self.config.apiVersion == 2) ? 'generalv2' : 'general'
          return self.request(method, hash).then(function(general) {
            data.data.downloaddir = (general.data.save_path) ? general.data.save_path.slice(0, -1) : undefined
            return data.data
          })
        })
      },
      execute: function(method, id) {
        var self = this
        var hashkey = 'hash='
        if (self.config.apiVersion == 2) {
          method = method + 'v2'
          hashkey = 'hashes='
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
    return qBittorrent32plusAPI
  }
])

  .factory('qBittorrent32plus', ['BaseTorrentClient', 'qBittorrentRemote', 'qBittorrent32plusAPI',
    function(BaseTorrentClient, qBittorrentRemote, qBittorrent32plusAPI) {
      var qBittorrent32plus = function() {
        BaseTorrentClient.call(this)
      }
      qBittorrent32plus.extends(BaseTorrentClient, {})

      var service = new qBittorrent32plus()
      service.setName('qBittorrent 3.2+')
      service.setAPI(new qBittorrent32plusAPI())
      service.setRemote(new qBittorrentRemote())
      service.setConfigMappings({
        server: 'qbittorrent32plus.server',
        port: 'qbittorrent32plus.port',
        username: 'qbittorrent32plus.username',
        password: 'qbittorrent32plus.password',
        use_auth: 'qbittorrent32plus.use_auth'
      })
      service.setEndpoints({
        torrents: '/query/torrents',
        torrentsv2: '/api/v2/torrents/info',
        addmagnet: '/command/download',
        addmagnetv2: '/api/v2/torrents/add',
        addfile: '/command/upload',
        addfilev2: '/api/v2/torrents/add',
        resume: '/command/resume',
        resumev2: '/api/v2/torrents/resume',
        pause: '/command/pause',
        pausev2: '/api/v2/torrents/pause',
        remove: '/command/delete',
        removev2: '/api/v2/torrents/delete?hashes=%s&deleteFiles=false',
        files: '/query/propertiesFiles/%s',
        filesv2: '/api/v2/torrents/files?hash=%s',
        general: '/query/propertiesGeneral/%s',
        generalv2: '/api/v2/torrents/properties?hash=%s',
        version: '/version/api',
        versionv2: '/api/v2/app/webapiVersion',
        login: '/login',
        loginv2: '/api/v2/auth/login'
      })
      service.readConfig()

      return service
    }
  ])

  .run(['DuckieTorrent', 'qBittorrent32plus', 'SettingsService',
    function(DuckieTorrent, qBittorrent32plus, SettingsService) {
      if (SettingsService.get('torrenting.enabled')) {
        DuckieTorrent.register('qBittorrent 3.2+', qBittorrent32plus)
      }
    }
  ])
