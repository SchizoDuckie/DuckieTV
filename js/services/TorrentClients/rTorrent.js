/**
 * rTorrent
 *
 * API Docs:
 * https://github.com/rakshasa/rtorrent/wiki/RPC-Setup-XMLRPC
 * https://github.com/rakshasa/rtorrent/wiki/rTorrent-0.9-Comprehensive-Command-list-(WIP)
 *
 * - Supports setting download directory
 * - Does not supports setting a Label
 */
var rTorrentData = function(data) {
  this.update(data)
}

PromiseFileReader = function() {
  this.readAsDataURL = function(blob) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader()
      reader.onload = function(e) {
        resolve(e.target.result)
      }
      reader.onerror = function(e) {
        reject(e)
      }
      reader.readAsDataURL(blob)
    })
  }

  return this
}

rTorrentData.extends(TorrentData, {
  getName: function() {
    return this.name
  },
  getProgress: function() {
    return this.round(this.bytes_done / this.size_bytes * 100, 1)
  },
  getDownloadSpeed: function() {
    return this.down_rate // Bytes/second
  },
  start: function() {
    this.getClient().getAPI().execute('d.start', this.hash)
  },
  stop: function() {
    this.getClient().getAPI().execute('d.stop', this.hash)
  },
  pause: function() {
    this.getClient().getAPI().execute('d.pause', this.hash)
  },
  remove: function() {
    this.getClient().getAPI().execute('d.erase', this.hash)
  },
  isStarted: function() {
    return this.state > 0
  },
  /**
     * Impossible without parsing the .torrent???
     */
  getFiles: function() {
    var self = this
    return new Promise(function(resolve) {
      resolve([{name: self.base_filename}])
    })
  },
  getDownloadDir: function() {
    return this.directory_base
  }
})

DuckieTorrent.factory('rTorrentRemote', ['BaseTorrentRemote',
  function(BaseTorrentRemote) {
    var rTorrentRemote = function() {
      BaseTorrentRemote.call(this)
      this.dataClass = rTorrentData
    }
    rTorrentRemote.extends(BaseTorrentRemote)

    return rTorrentRemote
  }
])

  .factory('rTorrentAPI', ['BaseHTTPApi', 'xmlrpc', '$q',
    function(BaseHTTPApi, xmlrpc, $q) {
      var rTorrentAPI = function() {
        BaseHTTPApi.call(this)
      }
      rTorrentAPI.extends(BaseHTTPApi, {

        rpc: function(method, params, options) {
          xmlrpc.config({
            hostName: this.config.server + ':' + this.config.port, // Default is empty
            pathName: this.config.path, // Default is /RPC2
            401: function() {
              console.warn('You shall not pass !')
            },
            404: function() {
              console.info('API not found')
            },
            500: function() {
              console.error('Something went wrong :(')
            }
          })

          return xmlrpc.callMethod(method, params).then(function(result) {
            return result
          })
        },
        portscan: function() {
          return this.rpc('system.api_version').then(function(result) {
            return result !== undefined
          }, function() {
            return false
          })
        },
        getTorrents: function() {
          var self = this
          return this.rpc('download_list').then(function(data) {
            var args = []
            var indexMap = {}
            var props = ['d.base_filename', 'd.base_path', 'd.bytes_done', 'd.completed_bytes', 'd.directory', 'd.directory_base', 'd.down.rate', 'd.down.total', 'd.hash', 'd.name', 'd.size_bytes', 'd.state', 'd.up.rate']

            data.map(function(hash) {
              indexMap[hash] = {}
              props.map(function(prop) {
                propTransformer(prop, hash)
              })
            })

            function propTransformer(prop, hash) {
              var idx = args.push({ 'methodName': prop, 'params': [hash] })
              indexMap[hash][prop] = idx - 1
            }

            return self.rpc('system.multicall', [args]).then(function(result) {
              var output = []
              Object.keys(indexMap).map(function(hash) {
                var torrent = { hash: hash }
                Object.keys(indexMap[hash]).map(function(property) {
                  torrent[property.replace('d.', '').replace('.rate', '_rate')] = result[indexMap[hash][property]][0]
                })
                output.push(torrent)
              })
              return output
            })
            /*
    {"key":"hash","rt":"d.hash="},
    {"key":"state","rt":"d.state="},
    {"key":"name","rt":"d.name="},
    {"key":"size_bytes","rt":"d.size_bytes="},
    {"key":"up_total","rt":"d.up.total="},
    {"key":"ratio","rt":"d.ratio="},
    {"key":"up_rate","rt":"d.up.rate="},
    {"key":"down_rate","rt":"d.down.rate="},
    {"key":"peers","rt":"d.peers_accounted="},
    {"key":"base_path","rt":"d.base_path="},
    {"key":"date","rt":"d.creation_date="},
    {"key":"active","rt":"d.is_active="},
    {"key":"complete","rt":"d.complete="},
    {"key":"downsize","rt":"d.down.total="},
    {"key":"directory","rt":"d.directory="},
    {"key":"skipsize","rt":"d.skip.total="}
    */
            return data.arguments.torrents.map(function(el) {
              el.hash = el.hashString.toUpperCase()
              return el
            })
          })
        },
        addMagnet: function(magnet, dlPath) {
          if (dlPath !== undefined && dlPath !== null) {
            // using custom download directory
            var parms = ["", magnet, 'd.directory_base.set="' + dlPath + '"']
          } else {
            // using default download directory
            var parms = ["", magnet]
          }
          return this.rpc('load.start', parms)
        },
        addTorrentByUrl: function(url, infoHash, releaseName, dlPath) {
          var self = this
          return this.addMagnet(url, dlPath).then(function(result) {
            var currentTry = 0
            var maxTries = 5
            // wait for rTorrent to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
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
        addTorrentByUpload: function(data, infoHash, releaseName, dlPath) {
          var self = this
          return new PromiseFileReader().readAsDataURL(data).then(function(contents) {
            var key = 'base64,'

            var index = contents.indexOf(key)
            if (index > -1) {
              var value = new base64_xmlrpc_value(contents.substring(index + key.length))
              if (dlPath !== undefined && dlPath !== null) {
                // using custom download directory
                var parms = ["", value, 'd.directory_base.set="' + dlPath + '"']
              } else {
                // using default download directory
                var parms = ["", value]
              }
              return self.rpc('load.raw_start', parms).then(function(result) {
                var currentTry = 0
                var maxTries = 5
                // wait for rTorrent to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
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
            }
          })
        },
        /**
             * rTorrent supports setting the Download Path when adding magnets and .torrents.
             */
        isDownloadPathSupported: function() {
          return true
        },
        execute: function(method, id) {
          return this.rpc(method, [id])
        }
      })

      return rTorrentAPI
    }
  ])

  .factory('rTorrent', ['BaseTorrentClient', 'rTorrentRemote', 'rTorrentAPI',
    function(BaseTorrentClient, rTorrentRemote, rTorrentAPI) {
      var rTorrent = function() {
        BaseTorrentClient.call(this)
      }
      rTorrent.extends(BaseTorrentClient, {})

      var service = new rTorrent()
      service.setName('rTorrent')
      service.setAPI(new rTorrentAPI())
      service.setRemote(new rTorrentRemote())
      service.setConfigMappings({
        server: 'rtorrent.server',
        port: 'rtorrent.port',
        path: 'rtorrent.path'
      })
      service.readConfig()

      return service
    }
  ])

  .run(['DuckieTorrent', 'rTorrent', 'SettingsService',
    function(DuckieTorrent, rTorrent, SettingsService) {
      if (SettingsService.get('torrenting.enabled')) {
        DuckieTorrent.register('rTorrent', rTorrent)
      }
    }
  ])
