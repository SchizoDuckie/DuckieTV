DuckieTV.factory('SynologyDSVideo', ['$q', '$http', function($q, $http) {
    var config = {
        ip: '192.168.1.139',
        port: '5000',
        protocol: 'http',
        account: 'admin',
        password: 'admin',
    };

    var api = {
        getUrl: function(type, param) {
            var out = this.config.server + ':' + this.config.port + this.config.path;
            return (param) ? out.replace('%s', encodeURIComponent(param)) : out;
        },
        rpc: function(method, params, options) {
            var self = this,
                request = {
                    'method': method
                },
                headers = {
                    'X-Transmission-Session-Id': self.sessionID
                };

            for (var i in params) {
                request[i] = params[i];
            }

            if (this.config.use_auth) {
                headers.Authorization = [this.config.username, this.config.password];
            }
            return $http.post(this.getUrl('rpc'), request, {
                headers: headers
            }).then(function(response) {
                return response.data;
            }, function(e, f) {
                self.sessionID = e.headers('X-Transmission-Session-Id');
                if (e.status === 409) {
                    return self.rpc(method, request, options);
                }
            });
        }
    }

    return {
        login: function(username, password) {


        },
    }


}]);