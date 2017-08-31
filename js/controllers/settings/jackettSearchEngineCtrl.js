DuckieTV.controller("jackettSearchEngineCtrl", ["$scope", "$injector", "$http", "$q", "SettingsService", "TorrentSearchEngines", "dialogs",
    function($scope, $injector, $http, $q, SettingsService, TorrentSearchEngines, dialogs) {

        var self = this;

        // load the default engines
        this.nativeEngines = TorrentSearchEngines.getNativeEngines();

        // load the jackett engines
        this.jackettEngines = TorrentSearchEngines.getJackettEngines();

        // delete a jackett SE
        this.remove = function(engine) {
            TorrentSearchEngines.removeJackettEngine(engine);
            self.jackettEngines = TorrentSearchEngines.getJackettEngines();
        }

        // is the test button available?
        this.isTestDisabled = function(engine) {
            return engine.config.useTorznab;
        }
        
        // test jackett SE (using jackett admin test api)
        this.test = function(engine) {
            self.jackettEngines[engine.config.name].testing = true;
            $http.post(engine.config.test, {"indexer": engine.config.tracker}, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'cache': false
                }
            }).then(function(result){
                self.jackettEngines[engine.config.name].testing = false;
                if (result.data.result == 'success' || result.status == 204) { // api2 currently returns 204 for tests
                    self.jackettEngines[engine.config.name].testOK = true;
                    self.jackettEngines[engine.config.name].testMessage = 'success';
                } else {
                    self.jackettEngines[engine.config.name].testOK = false;
                    self.jackettEngines[engine.config.name].testMessage = (result.data.error) ? result.data.error : 'Error, unknown reason.';
                }
            },function(err){
                self.jackettEngines[engine.config.name].testOK = false;
                if (err.status == -1) {
                    self.jackettEngines[engine.config.name].testMessage = ['Status:', err.status, 'Reason:', 'Unknown, probably the Jackett Service or App is not active.'].join(' ');
                } else {
                    self.jackettEngines[engine.config.name].testMessage = ['Status:', err.status, 'Reason:', err.statusText || 'Error, unknown reason.'].join(' ');
                }
                self.jackettEngines[engine.config.name].testing = false;
            });            
        }

        // disable either a jackett or native SE
        this.disable = function(engine) {
            TorrentSearchEngines.disableSearchEngine(engine);
        };

        // enable either a jackett or native SE
        this.enable = function(engine) {
            TorrentSearchEngines.enableSearchEngine(engine);
        };

        // open a dialogue to add (or update) a jackett DB entity
        this.openDialog = function(jackett, addNew) {
            dialogs.create('templates/dialogs/jackettSearchEngine.html', 'jackettSearchEngineDialogCtrl as jse', {
                engine: jackett,
                isNew: addNew
            }, {
                size: 'lg'
            });
        };

        // is this the default SE ?
        this.isDefault = function(engineName) {
            return (engineName === TorrentSearchEngines.getDefaultEngineName());
        };

    }
])

.controller('jackettSearchEngineDialogCtrl', ['$scope', "$injector", "$http", "$q", "$uibModalInstance", "data", "TorrentSearchEngines", "FormlyLoader",
    function($scope, $injector, $http, $q, $modalInstance, data, TorrentSearchEngines, FormlyLoader) {

        var self = this;
        this.jackett = new Jackett();
        this.isNew = data.isNew == 1;
        if (data.engine && !data.isNew) {
            this.jackett = TorrentSearchEngines.getJackettFromCache(data.engine.config.name);
        }

        FormlyLoader.load('JackettSearchEngine').then(function(form) {
            self.model = self.jackett;
            // turn integer into boolean for check-box
            self.model.torznabEnabled = self.model.torznabEnabled == 1;
            self.model.isNew = self.isNew;
            self.fields = form;
        });


        this.save = function() {
            self.model.enabled = self.model.enabled ? 1 : 0;
            var apiVersion = 1;
            if (self.model.torznab.indexOf('/api/v2.') > -1) {
                apiVersion = 2;
            }
            if (apiVersion == 1) {
                var config = {
                    'isJackett': true,
                    'apiVersion': apiVersion,
                    'mirror': self.model.torznab.substr(0, self.model.torznab.indexOf('torznab')) + 'Admin/search',
                    'name': self.model.name,
                    'test': self.model.torznab.substr(0, self.model.torznab.indexOf('torznab')) + 'Admin/test_indexer',
                    'torznab': self.model.torznab + '/api?t=search&cat=&apikey=' + self.model.apiKey + '&q=',
                    'tracker': self.model.torznab.substr(self.model.torznab.indexOf('torznab') + 8),
                    'useTorznab': (self.model.torznabEnabled) ? true : false
                };
            } else {
                // API 2
                var config = {
                    'isJackett': true,
                    'apiVersion': apiVersion,
                    'apiKey': self.model.apiKey,
                    'mirror': self.model.torznab.replace(self.model.torznab.substr(self.model.torznab.indexOf('/indexers/') + 10), 'all') + '/results',
                    'name': self.model.name,
                    'test': self.model.torznab.replace('/results/torznab/','/test'),
                    'torznab': self.model.torznab,
                    'tracker': self.model.torznab.substr(self.model.torznab.indexOf('/indexers/') + 10).replace('/results/torznab/',''),
                    'useTorznab': (self.model.torznabEnabled) ? true : false
                };
            }
            self.model.json = JSON.stringify(config);
            // turn check-box boolean back into integer
            self.model.torznabEnabled = self.model.torznabEnabled ? 1 : 0;                  
            self.model.Persist().then(function() {
                TorrentSearchEngines.removeJackettFromCache(self.model.name);
                TorrentSearchEngines.addJackettEngine(self.model);
                self.jackettEngines = TorrentSearchEngines.getJackettEngines();
                $modalInstance.close();
                $scope.$destroy();
            });
        }

        self.cancel = function() {
            $modalInstance.close();
            $scope.$destroy();
        };
    }
]);
