/**
 * Inject a (dev-env only) HTTP request interceptor that transparently proxies your requests to an external server and saves them
 */
DuckieTV.factory('TransparentFixtureProxyInterceptor', ['$q', '$injector',
  function($q, $injector) {
    if (document.domain == 'localhost') { // or the domain your dev instance runs on
      return {
        request: function(config) {
          if (config.url.indexOf('localhost') === -1 && config.url.indexOf('http') === 0) {
            config.url = './tests/proxy.php?url=' + encodeURIComponent(config.url)
          }
          return config
        }
      }
    } else {
      return {}
    }
  }
])

  .config(['$httpProvider', '$compileProvider',
    function($httpProvider, $compileProvider) {
      if (document.domain == 'localhost') {
        $httpProvider.interceptors.push('TransparentFixtureProxyInterceptor')
      }
    }
  ])

/**
 * Inject a cross-domain enabling http proxy for the non-chrome extension function
 * Sweeeeet
 */
  .factory('CORSInterceptor', ['$q', '$injector',
    function($q, $injector) {
      return {
        request: function(config) {
          if (document.domain != 'localhost' && config.url.indexOf('http') == 0 && config.url.indexOf('localhost') === -1) {
            config.headers['X-Proxy-Url'] = config.url
            if (config.url.indexOf('http://duckietv.herokuapp.com/') == -1) config.url = 'http://duckietv.herokuapp.com/?t=' + new Date().getTime() + '&u=' + config.url
          }
          return config
        },
        'responseError': function(rejection) {
          if ('recovered' in rejection.config) {
            return rejection
          }
          rejection.config.recovered = true
          var $http = $injector.get('$http')
          return $http(rejection.config)
        }

      }
    }
  ])

/**
 * Set up the xml interceptor and whitelist the chrome extension's filesystem and magnet links
 */
  .config(['$httpProvider', '$compileProvider',
    function($httpProvider, $compileProvider) {
      if (window.location.href.indexOf('chrome-extension') === -1 && navigator.userAgent.indexOf('DuckieTV') == -1 && window.location.href.indexOf('file://') === -1) {
        $httpProvider.interceptors.push('CORSInterceptor')
      }
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|blob|mailto|chrome-extension|magnet|data|file):/)
      $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|data:image|filesystem:|chrome-extension:/)
    }
  ])

/**
 * Interceptor to queue Trakt HTTP requests.
 */
  .config(['$httpProvider',
    function($httpProvider){
      $httpProvider.interceptors.push(['$q', function($q) {
        var _queue = []
        /**
         * Shifts and executes the top function on the queue (if any). Note this function executes asynchronously (with a timeout of 350ms). This
         * gives 'response' and 'responseError' chance to return their values and have them processed by their calling 'success' or 'error'
         * methods.
         */
        function _shiftAndExecuteTop() {
          setTimeout(function() {
            _queue.shift()
            if (_queue.length > 0) {
              _queue[0]()
            }
          }, 350)
        }
        return {
          /**
           * Blocks each request on the queue. If the first request, processes immediately.
           */
          request: function(config) {
            // ignore uTorrent
            if (config.method == 'JSONP')
            {
              return config
            }
            if (config.url.substring(0, 20) == 'https://api.trakt.tv') {
              var deferred = $q.defer()
              _queue.push(function() {
                deferred.resolve(config);
              })
              if (_queue.length === 1) {
                _queue[0]()
              }
              return deferred.promise
            }
            else {
              return config
            }
          },
          /**
          * After each response completes, unblocks the next request.
          */
          response: function(response) {
            if (response.config.method == 'JSONP')
            {
              return response
            }
            if (response.config.url.substring(0, 20) == 'https://api.trakt.tv') {
              _shiftAndExecuteTop()
            }
            return response
          },
          /**
          * After each response errors, unblocks the next request.
          */
          responseError: function(responseError) {
            if (responseError.config.method == 'JSONP')
            {
              return responseError
            }
            if (responseError.config.url.substring(0, 20) == 'https://api.trakt.tv') {
              _shiftAndExecuteTop()
            }
            return $q.reject(responseError)
          },
        }
      }])
    }
  ])
