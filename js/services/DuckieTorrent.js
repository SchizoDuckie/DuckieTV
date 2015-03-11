/**
 * DuckieTorrent Utorrent (v3.3+)/ Bittorrent interface
 * Inspired by and reverse-engineered from Bittorrent's Torque labs btapp.js
 *
 * https://github.com/bittorrenttorque
 * https://github.com/bittorrenttorque/btapp
 * https://github.com/bittorrenttorque/visualizer
 *
 * This project was started because I have an angular.js app and I do not want the
 * dependencies to Torque, Backbone, Lodash, etc that btapp.js has. This should be a service with
 * a completely separated GUI, which it is now.
 *
 * The Utorrent/Bittorrent clients listen on one of 20 ports on localhost to allow other apps to connect
 * to them.
 * Discovery is done by performing a /version request to these ports until the first hit
 * After that, an authentication token is requested on the client (you need to save this somewhere, the demo does so in localStorage)
 * With the token you can get a session ID, and with the session ID you can start polling for data. Don't poll and the session will expire
 * and you will need to fetch a new session ID with the token.
 *
 * Polling for data results in a tree structure of RPC functions and object data
 * The RPC structures are matched against regexes and the parameters are type-checked.
 * Passing the wrong data into a callback will crash uTorrent/BitTorrent violently (Which could be an attack angle for security researchers)
 *
 * Since the amount of data that's returned from the torrent application to the browser can be quite large, multiple requests will build up your
 * local state (stored in the TorrentRemote service)
 *
 */
var DuckieTorrent = angular.module('DuckieTorrent.torrent', []);

DuckieTorrent.provider('DuckieTorrent', function() {

    var clients = {};
    this.$get = function() {
        return {
            getClients: function() {
                return clients;
            },

            register: function(name, client) {
                clients[name] = client;
            },
            getClient: function() {
                return clients['uTorrent']
            }
        }
    };
})


/**
 * Angular's private URL Builder method + unpublished dependencies converted to a public service
 * So we can properly build a GET url with parameters for a JSONP request.
 */
.provider('URLBuilder', function() {

    function encodeUriQuery(val, pctEncodeSpaces) {
        return encodeURIComponent(val).
        replace(/%40/gi, '@').
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
    }

    /**
     * Angular's private buildUrl function, patched to refer to the public methods on the angular globals
     */
    function buildUrl(url, params) {
        if (!params) return url;
        var parts = [];
        angular.forEach(params, function(value, key) {
            if (value === null || angular.isUndefined(value)) return;
            if (!angular.isArray(value)) value = [value];

            angular.forEach(value, function(v) {
                if (angular.isObject(v)) {
                    v = angular.toJson(v);
                }
                parts.push(encodeUriQuery(key) + '=' + encodeUriQuery(v));
            });
        });
        return url + ((url.indexOf('?') == -1) ? '?' : '&') + parts.join('&');
    }

    this.$get = function() {
        return {
            build: function(url, params) {
                return buildUrl(url, params);
            }
        };

    };
})

String.capitalize = function(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Simple recursive object merge that merges everyting from obj2 into obj1 and recurses until it can't go any deeper.
 */
Object.deepMerge = function(obj1, obj2) {
    for (var i in obj2) { // add the remaining properties from object 2
        if (typeof obj2[i] !== 'object' && typeof obj2[i] !== 'array') {
            obj1[i] = obj2[i];
        } else {
            obj1[i] = Object.deepMerge(i in obj1 ? obj1[i] : {}, obj2[i]);
        }
    }
    return obj1;
};