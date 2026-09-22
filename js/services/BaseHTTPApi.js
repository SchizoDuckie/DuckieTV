DuckieTV.factory('BaseHTTPApi', ['$http',
  function($http) {
    var BaseHTTPApi = function() {
      this.config = {
        server: null,
        port: null,
        username: null,
        use_auth: null,
        uses_custom_auth_method: false
      }

      this.endpoints = {
        torrents: null,
        portscan: null,
        addmagnet: null
      }
    }

    /**
     * Fetches the url, auto-replaces the port in the url if it was found.
     */
    BaseHTTPApi.prototype.getUrl = function(type, param) {
      var out = this.config.server + ':' + this.config.port + this.endpoints[type]
      return out.replace('%s', encodeURIComponent(param))
    }

    /**
     * Build a JSON request using the URLBuilder service.
     * @param string type url to fetch from the request types
     * @param string|number pathParam value for an endpoint's %s placeholder
     * @param object httpOptions options passed to $http.get
     */
    BaseHTTPApi.prototype.request = function(type, pathParam, httpOptions) {
      var url = this.getUrl(type, pathParam)
      httpOptions = angular.copy(httpOptions || {})
      var authHeaders = this.config.use_auth ? {
        Authorization: [this.config.username, this.config.password]
      } : {}
      // Explicit request headers take precedence over the default basic-auth header.
      httpOptions.headers = angular.extend({}, authHeaders, httpOptions.headers || {})
      return $http.get(url, httpOptions)
    }

    return BaseHTTPApi
  }
])
