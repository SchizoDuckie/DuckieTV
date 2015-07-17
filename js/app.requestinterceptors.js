/**
 * Inject a (dev-env only) HTTP request interceptor that transparently proxies your requests to an external server and saves them
 */
DuckieTV.factory('TransparentFixtureProxyInterceptor', ['$q', '$injector',
    function($q, $injector) {
        if (document.domain == 'localhost') { // or the domain your dev instance runs on
            return {
                request: function(config) {
                    if (config.url.indexOf('localhost') === -1 && config.url.indexOf('http') === 0) {
                        config.url = './tests/proxy.php?url=' + encodeURIComponent(config.url);
                    }
                    return config;
                }
            };
        } else {
            return {};
        }
    }
])

.config(["$httpProvider", "$compileProvider",
    function($httpProvider, $compileProvider) {
        if (document.domain == 'localhost') {
            $httpProvider.interceptors.push('TransparentFixtureProxyInterceptor');
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
                    config.headers['X-Proxy-Url'] = config.url;
                    if (config.url.indexOf('http://duckietv.herokuapp.com/') == -1) config.url = 'http://duckietv.herokuapp.com/?t=' + new Date().getTime() + '&u=' + config.url;
                }
                return config;
            },
            'responseError': function(rejection) {
                if ('recovered' in rejection.config) {
                    return rejection;
                }
                rejection.config.recovered = true;
                var $http = $injector.get('$http');
                return $http(rejection.config);
            }

        };
    }
])


/**
 * Set up the xml interceptor and whitelist the chrome extension's filesystem and magnet links
 */
.config(["$httpProvider", "$compileProvider",
    function($httpProvider, $compileProvider) {

        if (window.location.href.indexOf('chrome-extension') === -1 && navigator.userAgent.indexOf('DuckieTV') == -1 && window.location.href.indexOf('file://') === -1) {
            $httpProvider.interceptors.push('CORSInterceptor');
        }
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|blob|mailto|chrome-extension|magnet|data|file):/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|data:image|filesystem:|chrome-extension:/);
    }
]);