DuckieTV.controller("customSearchEngineCtrl", ["$scope", "$injector", "$http", "$q", "SettingsService", "TorrentSearchEngines", "dialogs",
    function($scope, $injector, $http, $q, SettingsService, TorrentSearchEngines, dialogs) {

        var self = this;
        this.status = 'Idle';

        this.defaultEngines = Object.keys(TorrentSearchEngines.getSearchEngines());

        // List of current engines for testing. When actual saving functionality is added we need to load
        // the engines here first and then send them over to the dialog along with the $index of what one was selected
        this.customEngines = {};

        CRUD.Find("SearchEngine").then(function(results) {
            return results.map(function(engine) {
                self.customEngines[engine.name] = engine;
            })
        });

        this.test = function(index) {
            this.status = 'creating test client';
            this.model = this.customEngines[index];

            var testClient = self.model.getFreshInstance($q, $http, $injector);

            this.status = "Executing test search";
            testClient.search(this.model.testSearch).then(function(results) {
                self.status = results.length > 0 ? 'Working!' : 'No results for search query :( ';
                $scope.$applyAsync();
            });
        };

        this.remove = function(engine) {
            TorrentSearchEngines.removeSearchEngine(engine);
        }

        // Disabling currently does nothing atm
        this.disable = function(engine) {
            TorrentSearchEngines.disableSearchEngine(engine);
        };

        // Enabling currently does nothing atm
        this.enable = function(engine) {
            TorrentSearchEngines.enableSearchEngine(engine);
        };

        this.openDialog = function(index, addNew) {
            // Opens dialog and sends list of current engines and the index of the one we are editing
            dialogs.create('templates/dialogs/customSearchEngine.html', 'customSearchEngineDialogCtrl as cse', {
                engine: self.customEngines[Object.keys(self.customEngines)[index]],
                isNew: addNew
            }, {
                size: 'lg'
            });
        };

        this.shareDialog = function(index) {
            dialogs.create('templates/dialogs/shareTorrentSearchEngine.html', 'shareSearchEngineDialogCtrl as share', {
                engine: self.customEngines[Object.keys(self.customEngines)[index]]
            }, {
                size: 'md'
            });
        }
    }
])
.factory("PasteBin", ['$http', function($http) {

    var API_KEY = "ÇºëÝ½ñ¾µóvswõçm:Ý7ßö";
    var endpoint = "http://pastebin.com/api/api_post.php";

    service = {

        paste: function(title, data) {
            var postData = {
                'api_dev_key': btoa(API_KEY),
                'api_option': 'paste',
                'api_paste_format': 'json',
                'api_paste_name': title,
                'api_paste_code': data
                };
            return $http({ method: 'POST',
                url: endpoint, 
                data: postData,
                transformRequest: function(obj) {
                    var str = [];
                    for(var p in obj)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(function(result) {
                console.log("paste created!", result);
                return result.data;
            })
        }

    }

    return service;
}])

.controller('shareSearchEngineDialogCtrl', ['$scope', "data", "PasteBin",
    function($scope, data,PasteBin) {

        var self = this;
        this.engine = data.engine;
        this.pasteBinURL = null;
        
        this.shareString = stringify(data.engine.asObject(), { replacer: function(key,value) {
            if (null == value || value == "" || (typeof value == "object" && value.join && value.join('') == '')) {
                return undefined;
            }
            if (value === false) return 0;
            if (value === true) return 1;
            return value;
        }});

        this.shareToPasteBin = function() {
            PasteBin.paste("DuckieTV Custom Search Engine: "+this.engine.name, this.shareString).then(function(result) {
               self.pasteBinURL = result;
            })
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };
    }
])



.controller('customSearchEngineDialogCtrl', ['$scope', "$injector", "$http", "$q", "$timeout", "$uibModalInstance", "data", "TorrentSearchEngines", "FormlyLoader",
    function($scope, $injector, $http, $q, $timeout, $modalInstance, data, TorrentSearchEngines, FormlyLoader) {

        var self = this;
        this.isNew = data.isNew;

        // Function to push log messages onto the page, pushes new message to top of array
        this.pageLog = [];
        var pageLog = function(message) {
            if (message) {
                self.pageLog.unshift(message);
            }
        };

        pageLog("Initializing");



        this.add = function() {
            pageLog("Attempting to add new Engine");
            // Note: SchizoDuckie recommended adding a checkbox for the noMagnet value
            // Note2: If a magneturl is provided it will ignore the torrentUrl if noMagnet is enabled otherwise it will use torrentUrl
            // Note3: A torrenturl will still be generated so entereing a torrenturl isn't needed if a magneturl is entered
            TorrentSearchEngines.registerSearchEngine(this.model.name, getTestClient());
            pageLog("Hopefully added engine");
        };



        var getTestClient = function() {
            return self.model.getFreshInstance($q, $http, $injector);

        };

        this.test = function() {
            pageLog("Creating testing client and Executing test search");
            getTestClient().search(self.model.testSearch).then(function(results) {
                pageLog(results.length > 0 ? "Test search working!" : "No results for search query :(");
                $scope.$applyAsync();
            });
        };

        var revalidateRowSelectors = function() {
            self.fields.map(function(field) {
                if (field.fieldGroup && field.fieldGroup.length == 3 && field.fieldGroup[0].formControl) {
                    field.fieldGroup[0].formControl.$validate();
                }
            });
        };


        pageLog("Loaded Attribute Whitelist");

        var cachedResult = null;
        var firstResult = null;

        function getCachedScraper(forceRefresh) {
            return $q(function(resolve, reject) {
                if (!cachedResult || forceRefresh) {
                    return getTestClient().executeSearch(self.model.testSearch).then(function(result) {
                        cachedResult = new HTMLScraper(result.data);
                        console.info("Executed new testsearch", cachedResult);
                        resolve(cachedResult);
                    });
                } else {
                    console.info("Returning cached result", cachedResult);
                    resolve(cachedResult);
                }
            });
        }

        FormlyLoader.setMapping('validators', {
            searchResultsContainer: {
                expression: function($viewValue, $modelValue, scope) {
                    return getCachedScraper().then(function(d) {
                        try {
                            var results = d.querySelectorAll($viewValue);
                            console.log("Results: ", results);
                            if (!results || results.length === 0) {
                                self.model.infoMessages[scope.options.key] = 'No results found.';
                                throw new Error("no results found");
                            } else {
                                firstResult = results[0];
                                self.model.infoMessages[scope.options.key] = results.length + ' results found.';
                                revalidateRowSelectors();
                                return true;
                            }
                        } catch (E) {
                            self.model.infoMessages[scope.options.key] = E.message;
                            throw E;
                        }
                    });

                }
            },
            propertySelector: {
                expression: function($viewValue, $modelValue, scope) {
                    console.warn(scope.options.key + " validate!");
                    return $q(function(resolve, reject) {
                        if (firstResult) {
                            try {
                                var property = self.model[scope.options.key.replace('Selector', 'Property')];
                                console.warn("Property for " + scope.options.key + ": " + property, $viewValue, firstResult.querySelector($viewValue), firstResult.querySelector($viewValue)[self.model[property]], firstResult.querySelector($viewValue).getAttribute(property));
                                var el = firstResult.querySelector($viewValue);
                                self.model.infoMessages[scope.options.key] = (property == 'href' || property == 'src') ? el.getAttribute(property) : el[property];
                            } catch (E) {
                                self.model.infoMessages[scope.options.key] = E.message;
                            }
                            resolve();
                        } else {
                            throw "no results.";
                        }
                    });
                }
            },
            attributeSelector: {
                expression: function($viewValue, $modelValue, scope) {
                    return $q(function(resolve) {
                        resolve();
                        setTimeout(function() {
                            revalidateRowSelectors();
                        });
                    });
                }
            },
            loginPage: {
                expression: function($viewValue, $modelValue, scope) {
                    return $http.get(self.model.mirror + $viewValue).then(function(result) {
                        self.model.infoMessages[scope.options.key] = 'Login page found';
                    }, function(err) {
                        throw "Page not found " + err.message;
                    });
                }
            },
            loginTestSelector: {
                expression: function($viewValue, $modelValue, scope) {
                    return getCachedScraper().then(function(d) {
                        try {
                            var results = d.querySelectorAll($viewValue);
                            console.log("Results: ", results);
                            if (!results || results.length === 0) {
                                self.model.infoMessages[scope.options.key] = 'No results found, but assuming loggedin';
                            } else {
                                self.model.infoMessages[scope.options.key] = 'Not loggedin test OK';
                            }
                        } catch (E) {
                            self.model.infoMessages[scope.options.key] = E.message;
                            throw E;
                        }
                    });

                }
            }
        });

        FormlyLoader.setMapping('options', {
            attributeWhitelist: [{
                name: 'href',
            }, {
                name: 'innerText',
            }, {
                name: 'title',
            }, {
                name: 'src',
            }, {
                name: 'alt',
            }]
        });

        FormlyLoader.setMapping('modelOptions', {
            keyup: {
                "updateOn": "keyup",
                "debounce": 200
            }
        });

        FormlyLoader.load('CustomSearchEngine').then(function(fields) {
            if (data.engine && !data.isNew) {
                pageLog("Engine detected that isn't new, editing mode");
                self.model = data.engine;
            } else if (data.isNew) {
                pageLog("New engine detected, adding mode");
                self.model = {};
            }

            self.model.infoMessages = {
                'releaseNameSelector': 'testing'
            };

            self.fields = fields;
            console.log("Loaded!", fields);
        });

        this.testResults = {
            'searchResultsContainer': 'woei'

        };

        this.save = function() {
            this.model.Persist().then(function() {
                pagelog(this.model.name + " stored in db. ID: " + this.model.getID());
            });
        }

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };
    }
]);
