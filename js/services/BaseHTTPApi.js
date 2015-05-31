DuckieTV.factory('BaseHTTPApi', ["$http",
    function($http) {

        var BaseHTTPApi = function() {
            this.config = {
                server: null,
                port: null,
                username: null,
                use_auth: null
            };

            this.endpoints = {
                torrents: null,
                portscan: null,
                addmagnet: null
            };
        };

        /**
         * Fetches the url, auto-replaces the port in the url if it was found.
         */
        BaseHTTPApi.prototype.getUrl = function(type, param) {
            var out = this.config.server + ':' + this.config.port + this.endpoints[type];
            if (this.config.use_auth) {
                out = out.replace('://', '://' + this.config.username + ':' + this.config.password + '@');
            }
            return out.replace('%s', encodeURIComponent(param));
        };

        /**
         * Build a JSON request using the URLBuilder service.
         * @param string type url to fetch from the request types
         * @param object params GET parameters
         * @param object options $http optional options
         */
        BaseHTTPApi.prototype.request = function(type, params, options) {
            params = params || {};
            var url = this.getUrl(type, params);

            return $http.get(url);
        };

        return BaseHTTPApi;

    }
]);