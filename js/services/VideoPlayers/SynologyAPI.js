DuckieTV.factory('SynologyAPI', ['$q', '$http', 'URLBuilder', 'SettingsService', function($q, $http, URLBuilder, SettingsService) {

    var self = this;

    var config = {
        ip: '192.168.178.222',
        port: '5000',
        protocol: 'http',
        username: null,
        password: null,
        url: '/webapi/%s'
    };

    var errors = {
        100: "Unknown error",
        101: "Invalid parameter",
        102: "The requested API does not exist",
        103: "The requested method does not exist",
        104: "The requested version does not support the functionality",
        105: "The logged in session does not have permission",
        106: "Session timeout",
        107: "Session interrupted by duplicate login",
        400: "Authorization failure",
        401: "Guest or disabled account",
        402: "Permission denied - DSM-Session: make sure user is member of Admin-group",
        403: "One time password not specified",
        404: "One time password authenticate failed",
        407: "Permission denied - IP banned in DSM blocklist?",
        450: "Unknown Error"
    }

    /**
     * API will be automagically loaded from synology device, then initialized goes to true.
     */
    this.initialized = false;
    this.initializing = false;

    this.api = {
        'SYNO.API.Info': {}
    };

    this.devices = [];

    this.sessionID = SettingsService.get('synology.sessionID', null);


    var parsers = {

        'SYNO.VideoStation.Folder': function(response) {
            return response.objects;
        }

    }

    function request(apiMethod, parameters) {
        /**
         * Always auto-initialize.
         */
        if (!self.initialized && apiMethod != 'SYNO.API.Info') {
            return service.fetchAPIInfo().then(function() {
                return request(apiMethod, parameters);
            });
        }

        if (self.sessionID) {
            parameters._sid = self.sessionID;
        }
        var url = buildUrl(apiMethod, parameters);
        delete(parameters._sid);
        if (parameters.path) {
            delete parameters.path;
        }
        return $http.post(url, URLBuilder.build('', parameters).slice(1), {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': "application/x-www-form-urlencoded"
                }
            })
            .then(function(result) {
                if (result.data.error) {
                    throw Error(errors[result.data.error.code]);
                }
                return result.data.data;
            }, function(err) {
                console.error("Synology API ERROR", err);
                throw Error("ERROR executing " + apiMethod + (err.message ? ":" + err.message : ""));
            });
    }


    function buildUrl(apiMethod, params) {

        var url = config.url;
        if (('path' in params)) {
            url = url.replace('%s', params.path);
            delete params.path;
        } else if ((apiMethod in self.api)) {
            url = url.replace('%s', self.api[apiMethod].path);
        }
        params.api = apiMethod;

        return URLBuilder.build(config.protocol + '://' + config.ip + ':' + config.port + url);
    }

    /**
     * Merge default config parameters when not set
     */
    function mergeDefaults(config, defaults) {
        if (!config) {
            config = {};
        }
        Object.keys(defaults).map(function(key) {
            if (!(key in config)) {
                config[key] = defaults[key];
            }
        });
        return config;
    }


    var service = {

        fetchAPIInfo: function() {
            if (!self.initialized && !self.initializing) {
                self.initializing = true;
                return request('SYNO.API.Info', {
                    'path': 'query.cgi',
                    'method': 'query',
                    'version': '1',
                    'query': 'all'
                }).then(function(result) {
                    self.api = result;
                    self.initialized = true;
                    self.initializing = false;
                    return self.api;
                });
            } else if (self.initialized) {
                return $q.when(function() {
                    return self.api;
                });
            } else {
                return $q(function(resolve) {
                    setTimeout(function() {
                        resolve(service.fetchAPIInfo);
                    }, 1000);
                });
            }
        },
        init: function() {
            if (self.sessionID !== null) {
                return $q.when(function() {
                    return self.sessionID
                });
            }
            return request('SYNO.API.Auth', {
                'method': 'login',
                'version': '2',
                'session': 'VideoStation',
                'format': 'cookie',
                'account': config.username,
                'passwd': config.password
            }).then(function(result) {
                self.sessionID = result.sid;
                SettingsService.set('synology.sessionID', result.sid);
                return true;
            })
        },
        deAuthorize: function() {
            this.sessionID = null;
            SettingsService.set('synology.sessionID', null);
        },
        isAuthenticated: function() {
            return self.sessionID !== null;
        },
        getSessionID: function() {
            return self.sessionID;
        },
        setConfig: function(newConfig) {
            Object.keys(newConfig).map(function(key) {
                config[key] = newConfig[key];
            })
        },
        DeviceList: function() {
            return request('SYNO.VideoController.Device', {
                method: 'list',
                version: 1
            }).then(function(result) {
                self.devices = result.devices;
                return result.devices;
            });
        },
        Library: function(parameters) {
            return request('SYNO.VideoStation2.Library', mergeDefaults(parameters, {
                method: 'list',
                offset: 0,
                limit: 1000,
                version: 1
            })).then(function(response) {
                return response.libraries;
            });
        },
        Poster: function(parameters) {
            return request('SYNO.VideoStation.Poster', parameters);
        },
        PluginSearch: function(parameters) {
            if (!('method' in parameters)) {
                parameters.method = 'list';
            }
            if (parameters.method === 'list') {
                parameters = mergeDefaults(parameters, {
                    offset: '0',
                    limit: '500',
                    sort_by: 'title',
                    sort_direction: 'asc',

                });
            }
            if (parameters.method === 'start') {
                parameters.preferlanguage = 'eng';
            }
            parameters.version = 1;
            return request('SYNO.VideoStation.PluginSearch', parameters);
        },
        Folder: function(parameters) {
            return request('SYNO.VideoStation.Folder', mergeDefaults(parameters, {
                method: 'list',
                sort_by: 'title',
                offset: '0',
                limit: '1000',
                sort_direction: 'asc',
                library_id: '0',
                type: 'tvshow',
                id: '',
                version: 1
            })).then(function(result) {
                return result.objects;
            })
        },
        Metadata: function(parameters) {
            if (!('method' in parameters)) {
                parameters.method = 'list';
            }
            return request('SYNO.VideoStation.Metadata', parameters);
        },
        Movie: function(parameters) {
            // set parameters to empty if they are not defined in input variable
            if (!('method' in parameters)) {
                parameters.method = 'list';
            }
            // default parameters for list method
            if (parameters.method == 'list') {

                parameters = mergeDefaults(parameters, {
                    sort_by: 'title',
                    offset: '0',
                    limit: '1000',
                    sort_direction: 'asc',
                    library_id: '0',
                    actor: '[]',
                    director: '[]',
                    writer: '[]',
                    genre: '[]',
                    year: '[]',
                    date: '[]',
                    channel_name: '[]',
                    title: '[]',
                    resolution: '[]',
                    watchedstatus: '[]',
                    filecount: '[]',
                    container: '[]',
                    duration: '[]',
                    additional: '["watched_ratio"]',
                    version: '2'
                });
            }
            request('SYNO.VideoStation.Movie', parameters);

        },
        Device: function(parameters) {
            return request('SYNO.Videostation2.Controller.Device', mergeDefaults(parameters, {
                method: 'list',
                version: 1
            }));
        },
        PlayFile: function(file, device) {
            var parameters = {
                'method': 'play',
                'position': '0'
            };
            parameters.id = device.id;
            parameters.title = device.title;
            parameters.file_id = file.id;

            if (this.currentSubtitles !== undefined) {
                parameters.subtitle_id = this.currentSubtitles;
            }
            return service.Playback(parameters);
        },
        Playback: function(parameters) {
            return request('SYNO.VideoController.Playback', mergeDefaults(parameters, {
                method: 'status',
                version: 2
            }));
        },
        Volume: function(parameters) {
            return request('SYNO.VideoController.Volume', mergeDefaults(parameters, {
                method: 'getvolume',
                version: 1
            }));
        },
        Subtitle: function(parameters) {
            return request('SYNO.VideoStation.Subtitle', mergeDefaults(parameters, {
                method: 'list',
                version: 2
            }));
        }
    }

    return service;
}]);