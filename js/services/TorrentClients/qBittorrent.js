/**
 * Shared qBittorrent Web API implementation. Version adapters supply only an
 * authentication strategy, settings mappings, and endpoint differences.
 */
var qBittorrentData = function(data) {
  this.update(data)
}

qBittorrentData.extends(TorrentData, {
  getName: function() { return this.name },
  getDownloadSpeed: function() { return this.dlspeed },
  getProgress: function() { return this.round(this.progress * 100, 1) },
  start: function() { this.getClient().getAPI().execute('resume', this.hash) },
  stop: function() { this.pause() },
  pause: function() { this.getClient().getAPI().execute('pause', this.hash) },
  remove: function() { this.getClient().getAPI().remove(this.hash) },
  getFiles: function() {
    var self = this
    return this.getClient().getAPI().getFiles(this.hash).then(function(results) {
      self.files = results
      return results
    })
  },
  getDownloadDir: function() { return this.files.downloaddir },
  isStarted: function() {
    return ['downloading', 'uploading', 'stalledDL', 'stalledUP'].indexOf(this.state) > -1
  }
})

DuckieTorrent.factory('qBittorrentRemote', ['BaseTorrentRemote', function(BaseTorrentRemote) {
  var qBittorrentRemote = function() {
    BaseTorrentRemote.call(this)
    this.dataClass = qBittorrentData
  }
  qBittorrentRemote.extends(BaseTorrentRemote)
  return qBittorrentRemote
}])

DuckieTorrent.factory('qBittorrentAuthStrategies', ['$http', function($http) {
  function forwardedHeaders(contentType) {
    var headers = { 'X-Forwarded-Host': window.location.origin }
    if (arguments.length > 0) headers['Content-Type'] = contentType
    return headers
  }

  return {
    session: {
      name: 'session',
      getHeaders: function() { return {} },
      postHeaders: function(api, contentType) { return forwardedHeaders(contentType) },
      login: function(api) {
        var body = 'username=' + encodeURIComponent(api.config.username) + '&password=' + encodeURIComponent(api.config.password)
        return $http.post(api.getUrl('login'), body, {
          headers: forwardedHeaders('application/x-www-form-urlencoded')
        }).then(function(result) {
          if (result.data !== 'Ok.' && result.status !== 204) throw new Error('Login failed!')
          return api.request('version').then(function(versionResult) {
            api.setApiVersion(versionResult.data)
            return true
          })
        })
      }
    },
    apiKey: {
      name: 'apiKey',
      getHeaders: function(api) { return { Authorization: 'Bearer ' + api.config.apikey } },
      postHeaders: function(api, contentType) {
        return angular.extend(forwardedHeaders(contentType), this.getHeaders(api))
      },
      login: function(api) {
        return $http.post(api.getUrl('version'), null, {
          headers: this.postHeaders(api, 'application/x-www-form-urlencoded')
        }).then(function(result) {
          if (!angular.isString(result.data) || !result.data.startsWith('2.')) throw new Error('Login failed!')
          api.setApiVersion(result.data)
          return true
        })
      }
    }
  }
}])

DuckieTorrent.factory('qBittorrentAPI', ['BaseHTTPApi', '$http', '$q', function(BaseHTTPApi, $http, $q) {
  function checkAddResponse(response) {
    if (response.data === 'Fails.') throw new Error('qBittorrent rejected the torrent')
    return response
  }

  var qBittorrentAPI = function(authStrategy) {
    BaseHTTPApi.call(this)
    this.authStrategy = authStrategy
    this.config.apiVersion = 2
    this.config.apiSubVersion = 0
  }

  qBittorrentAPI.extends(BaseHTTPApi, {
    setApiVersion: function(version) {
      this.config.apiSubVersion = parseInt(version.split('.')[1], 10) || 0
    },
    login: function() { return this.authStrategy.login(this) },
    portscan: function() {
      return this.login().then(function() { return true }, function() { return false })
    },
    addMagnet: function(magnetHash, dlPath, label) {
      var fd = new FormData()
      fd.append('urls', magnetHash)
      if (dlPath !== undefined && dlPath !== null) fd.append('savepath', dlPath)
      if (label !== undefined && label !== null) fd.append('category', label)
      return $http.post(this.getUrl('addmagnet'), fd, {
        headers: this.authStrategy.postHeaders(this, undefined)
      }).then(checkAddResponse)
    },
    addTorrentByUpload: function(data, infoHash, releaseName, dlPath, label) {
      var self = this
      var fd = new FormData()
      fd.append('torrents', data, releaseName + '.torrent')
      if (dlPath !== undefined && dlPath !== null) fd.append('savepath', dlPath)
      if (label !== undefined && label !== null) fd.append('category', label)
      return $http.post(this.getUrl('addfile'), fd, {
        transformRequest: angular.identity,
        headers: this.authStrategy.postHeaders(this, undefined)
      }).then(checkAddResponse).then(function() { return self.waitForTorrent(infoHash, releaseName) })
    },
    addTorrentByUrl: function(url, infoHash, releaseName, dlPath, label) {
      var self = this
      return this.addMagnet(url, dlPath, label).then(function() {
        return self.waitForTorrent(infoHash, releaseName)
      })
    },
    isDownloadPathSupported: function() { return true },
    isLabelSupported: function() { return true },
    remove: function(magnetHash) {
      var fd = new FormData()
      fd.append('hashes', magnetHash)
      fd.append('deleteFiles', false)
      return $http.post(this.getUrl('remove'), fd, {
        headers: this.authStrategy.postHeaders(this, undefined)
      })
    },
    getTorrents: function() {
      return this.request('torrents', undefined, {
        headers: this.authStrategy.getHeaders(this)
      }).then(function(result) { return result.data })
    },
    getFiles: function(hash) {
      if (hash === null || typeof hash === 'undefined') return $q.when([])
      var self = this
      var options = { headers: this.authStrategy.getHeaders(this) }
      return this.request('files', hash, options).then(function(result) {
        return self.request('general', hash, options).then(function(general) {
          result.data.downloaddir = general.data.save_path ? general.data.save_path.slice(0, -1) : undefined
          return result.data
        })
      })
    },
    execute: function(method, id) {
      if (this.config.apiSubVersion > 10) method += 'sub11'
      return $http.post(this.getUrl(method), 'hashes=' + id, {
        headers: this.authStrategy.postHeaders(this, 'application/x-www-form-urlencoded')
      })
    }
  })
  return qBittorrentAPI
}])

DuckieTorrent.factory('qBittorrentClientFactory', ['BaseTorrentClient', 'qBittorrentRemote', function(BaseTorrentClient, qBittorrentRemote) {
  var commonEndpoints = {
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
  }

  return {
    create: function(options) {
      var Client = function() { BaseTorrentClient.call(this) }
      var API = options.API
      var Remote = qBittorrentRemote
      Client.extends(BaseTorrentClient, {})
      var service = new Client()
      service.setName(options.name)
      service.setAPI(new API())
      service.setRemote(new Remote())
      service.setConfigMappings(options.configMappings)
      service.setEndpoints(angular.extend({}, commonEndpoints, options.endpoints || {}))
      service.readConfig()
      return service
    }
  }
}])
