DuckieTV.factory('BaseHTTPApi', ["$http",
    function($http) {

        var BaseHTTPApi = function() {
            this.config = {
                server: null,
                port: null,
                username: null,
                use_auth: null,
                uses_custom_auth_method: false
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
            var httpOptions = this.config.use_auth ? {
                headers: {
                    Authorization: [this.config.username, this.config.password]
                }
            } : {};
            return $http.get(url, httpOptions);
        };

        return BaseHTTPApi;

    }
]);