DuckieTV.controller("customSearchEngineCtrl", ["$scope", "$injector", "$http", "$q", "SettingsService", "TorrentSearchEngines", "dialogs",
    function($scope, $injector, $http, $q, SettingsService, TorrentSearchEngines, dialogs) {

        var self = this;
        self.status = 'Idle';
        this.model = null;
        this.defaultEngines = Object.keys(TorrentSearchEngines.getSearchEngines());

        // List of current engines for testing. When actual saving functionality is added we need to load
        // the engines here first and then send them over to the dialog along with the $index of what one was selected
        this.customEngines = {
            'Torrentleech': {
                testSearch: 'test',
                name: 'Torrentleech.org',
                mirror: 'http://torrentleech.org', // http://yoursite.com',
                searchEndpoint: '/torrents/browse/index/query/%s',
                searchResultsContainer: '#torrenttable tr:not(:first-child)',
                releaseNameSelector: 'td.name .title a',
                releaseNameProperty: 'innerText',
                magnetSupported: false,
                magnetUrlSelector: '',
                magnetUrlProperty: '',
                torrentUrlSelector: 'td.quickdownload a',
                torrentUrlProperty: 'href',
                sizeSelector: 'td:nth-child(5)',
                sizeProperty: 'innerText',
                seederSelector: 'td.seeders',
                seederProperty: 'innerText',
                leecherSelector: 'td.leechers',
                leecherProperty: 'innerText',
                detailUrlSelector: 'td.name .title a',
                detailUrlProperty: 'href',
                loginRequired: true,
                loginPage: '/login.php',
                loginTestSelector: '#loginform'
            },
            'kat.cr': {
                testSearch: 'test',
                name: 'kat.cr',
                mirror: 'https://kat.cr', // http://yoursite.com',
                searchEndpoint: '/usearch/%s/?field=seeders&sorder=desc',
                searchResultsContainer: 'table.data tr[id^=torrent]',
                releaseNameSelector: 'div.torrentname a.cellMainLink',
                releaseNameProperty: 'innerText',
                magnetUrlSelector: 'a[title="Torrent magnet link"]',
                magnetUrlProperty: 'href',
                torrentUrlSelector: '',
                torrentUrlProperty: '',
                sizeSelector: 'td:nth-child(2)',
                sizeProperty: 'innerText',
                seederSelector: 'td:nth-child(5)',
                seederProperty: 'innerText',
                leecherSelector: 'td:nth-child(6)',
                leecherProperty: 'innerText',
                detailUrlSelector: 'div.torrentname a.cellMainLink',
                detailUrlProperty: 'href'
            }
        };

        this.test = function(index) {
            self.status = 'creating test client';
            this.model = angular.copy(this.customEngines[Object.keys(this.customEngines)[index]]);

            var testClient = new GenericTorrentSearchEngine({
                mirror: this.model.mirror,
                noMagnet: true, // hasMagnet,
                includeBaseURL: true, // this.model.includeBaseUrl,
                endpoints: {
                    search: this.model.searchEndpoint,
                    details: [this.model.detailUrlSelector, this.model.detailUrlProperty]
                },
                selectors: {
                    resultContainer: this.model.searchResultsContainer,
                    releasename: [this.model.releaseNameSelector, this.model.releaseNameProperty],
                    magnetUrl: [this.model.magnetUrlSelector, this.model.magnetUrlProperty],
                    torrentUrl: [this.model.torrentUrlSelector, this.model.torrentUrlProperty],
                    size: [this.model.sizeSelector, this.model.sizeProperty],
                    seeders: [this.model.seederSelector, this.model.seederProperty],
                    leechers: [this.model.leecherSelector, this.model.leecherProperty],
                    detailUrl: [this.model.detailUrlSelector, this.model.detailUrlProperty]
                }
            }, $q, $http, $injector);

            self.status = "Executing test search";
            testClient.search(self.model.testSearch).then(function(results) {
                self.status = results.length > 0 ? 'Working!' : 'No results for search query :( ';
                $scope.$applyAsync();
            });
        };

        // Disabling currently does nothing atm
        this.disable = function(name, remove) {
            // Delete the engine instead of disable it
            if (remove) {
                TorrentSearchEngines.removeSearchEngine(name);
                self.status = "Removed Search Engine " + name;
            } else {
                TorrentSearchEngines.disableSearchEngine(name);
                self.status = "Disabled Search Engine " + name;
            }
        };

        // Enabling currently does nothing atm
        this.enable = function(name) {
            TorrentSearchEngines.enableSearchEngine(name);
        };

        this.openDialog = function(index, addNew) {
            // Opens dialog and sends list of current engines and the index of the one we are editing
            dialogs.create('templates/customSearchEngineDialog.html', 'customSearchEngineDialogCtrl as cse', {
                engine: self.customEngines[Object.keys(self.customEngines)[index]],
                isNew: addNew
            }, {
                size: 'lg'
            });
        };
    }
])

.controller('customSearchEngineDialogCtrl', ['$scope', "$injector", "$http", "$q", "$timeout", "$modalInstance", "data", "TorrentSearchEngines",
    function($scope, $injector, $http, $q, $timeout, $modalInstance, data, TorrentSearchEngines) {

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



        if (data.engine && !data.isNew) {
            pageLog("Engine detected that isn't new, editing mode");
            this.model = data.engine;
        } else if (data.isNew) {
            pageLog("New engine detected, adding mode");
            this.model = {};
        }

        this.model.infoMessages = {
            'releaseNameSelector': 'testing'
        };


        this.add = function() {
            pageLog("Attempting to add new Engine");
            // Note: SchizoDuckie recommended adding a checkbox for the noMagnet value
            // Note2: If a magneturl is provided it will ignore the torrentUrl if noMagnet is enabled otherwise it will use torrentUrl
            // Note3: A torrenturl will still be generated so entereing a torrenturl isn't needed if a magneturl is entered
            var hasMagnet = self.model.magnetUrlSelector.length > 2 ? false : true;
            TorrentSearchEngines.registerSearchEngine(this.model.name,
                new GenericTorrentSearchEngine({
                    mirror: this.model.mirror,
                    noMagnet: hasMagnet,
                    includeBaseURL: true, // this.model.includeBaseUrl, this is needed where the detailsUrl we get isn't a direct link (kat) so we need to tell the search thingy to add it
                    endpoints: {
                        search: this.model.searchEndpoint,
                        details: [this.model.detailUrlSelector, this.model.detailUrlProperty]
                    },
                    selectors: {
                        resultContainer: this.model.searchResultsContainer,
                        releasename: [this.model.releaseNameSelector, this.model.releaseNameProperty],
                        magneturl: [this.model.magnetUrlSelector, this.model.magnetUrlProperty],
                        torrentUrl: [this.model.torrentUrlSelector, this.model.torrentUrlProperty],
                        size: [this.model.sizeSelector, this.model.sizeProperty],
                        seeders: [this.model.seederSelector, this.model.seederProperty],
                        leechers: [this.model.leecherSelector, this.model.leecherProperty],
                        detailUrl: [this.model.detailUrlSelector, this.model.detailUrlProperty]
                    }
                }, $q, $http, $injector));
            pageLog("Hopefully added engine");
        };



        var getTestClient = function() {
            return new GenericTorrentSearchEngine({

                mirror: self.model.mirror,
                noMagnet: true, // hasMagnet,
                includeBaseURL: true, // this.model.includeBaseUrl,
                endpoints: {
                    search: self.model.searchEndpoint,
                    details: [self.model.detailUrlSelector, self.model.detailUrlProperty]
                },
                selectors: {
                    resultContainer: self.model.searchResultsContainer,
                    releasename: [self.model.releaseNameSelector, self.model.releaseNameProperty],
                    magnetUrl: [self.model.magnetUrlSelector, self.model.magnetUrlProperty],
                    torrentUrl: [self.model.torrentUrlSelector, self.model.torrentUrlProperty],
                    size: [self.model.sizeSelector, self.model.sizeProperty],
                    seeders: [self.model.seederSelector, self.model.seederProperty],
                    leechers: [self.model.leecherSelector, self.model.leecherProperty],
                    detailUrl: [self.model.detailUrlSelector, self.model.detailUrlProperty]
                }
            }, $q, $http, $injector);

        };

        this.test = function() {
            pageLog("Creating testing client");
            var testClient = new GenericTorrentSearchEngine({

                mirror: self.model.mirror,
                noMagnet: true, // hasMagnet,
                includeBaseURL: true, // this.model.includeBaseUrl,
                endpoints: {
                    search: self.model.searchEndpoint,
                    details: [self.model.detailUrlSelector, self.model.detailUrlProperty]
                },
                selectors: {
                    resultContainer: self.model.searchResultsContainer,
                    releasename: [self.model.releaseNameSelector, self.model.releaseNameProperty],
                    magnetUrl: [self.model.magnetUrlSelector, self.model.magnetUrlProperty],
                    torrentUrl: [self.model.torrentUrlSelector, self.model.torrentUrlProperty],
                    size: [self.model.sizeSelector, self.model.sizeProperty],
                    seeders: [self.model.seederSelector, self.model.seederProperty],
                    leechers: [self.model.leecherSelector, self.model.leecherProperty],
                    detailUrl: [self.model.detailUrlSelector, self.model.detailUrlProperty]
                }
            }, $q, $http, $injector);

            pageLog("Executing test search");
            testClient.search(self.model.testSearch).then(function(results) {
                results.length > 0 ? pageLog("Test search working!") : pageLog("No results for search query :(");
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

        var attributeWhitelist = [{
            name: 'href',
        }, {
            name: 'innerText',
        }, {
            name: 'title',
        }, {
            name: 'src',
        }, {
            name: 'alt',
        }];

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

        var validators = {
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
                                self.model.inforMessages[scope.options.key] = 'Not loggedin test OK';
                            }
                        } catch (E) {
                            self.model.infoMessages[scope.options.key] = E.message;
                            throw E;
                        }
                    });

                }
            }
        };

        this.fields = [{
            key: 'name',
            type: "input",
            templateOptions: {
                required: true,
                label: "Search Engine Name",
                type: "text"
            }
        }, {
            key: 'mirror',
            type: "input",
            templateOptions: {
                required: true,
                label: "Base URL for site (exclude the final /)",
                type: "text"
            }
        }, {
            key: 'searchEndpoint',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                required: true,
                label: "Search page url (use %s to inject search query)",
                type: "text"
            }
        }, {
            key: 'testSearch',
            className: 'cseProperty',
            type: "input",
            templateOptions: {
                required: true,
                label: "Test SearchQuery",
                type: "text"
            }
        }, {
            key: 'searchResultsContainer',
            type: "input",
            templateOptions: {
                required: true,
                label: "Results selector (CSS selector that returns a base element for each individual search result)",
                type: "text",
            },
            asyncValidators: validators.searchResultsContainer
        }, {
            className: 'row',
            fieldGroup: [{
                key: 'loginRequired',
                className: 'col-xs-5 inline-checkbox',
                type: "input",
                templateOptions: {
                    label: "Login Required?",
                    type: "checkbox"
                }
            }, {
                key: 'magnetSupported',
                className: 'col-xs-5 inline-checkbox',
                type: "input",
                templateOptions: {
                    label: "Magnet URI supported?",
                    type: "checkbox"
                },
                asyncValidators: validators.propertySelector
            }]
        }, {
            key: 'releaseNameSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                required: true,
                label: "Release name Selector (within base element)",
                type: "text"
            },
            asyncValidators: validators.propertySelector
        }, {
            key: 'releaseNameProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                required: true,
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            }
        }, {
            key: 'loginPage',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                label: "URL of the login page (for when not logged in)",
                placeholder: '/login.php',
                type: "text"
            },
            asyncValidators: validators.loginPage
        }, {
            key: 'loginTestSelector',
            className: 'cseProperty',
            type: "input",
            templateOptions: {
                requiredExpression: 'model.loginRequired',
                label: "Selector that tests if we're not loggedin when executing a search",
                placeholder: '#loginform',
                type: "text"
            },
            asyncValidators: validators.loginTestSelector
        }, {
            key: 'magnetUrlSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                label: "magnet URL selector (hyperlink to the magnet url)",
                type: "text"
            },
            asyncValidators: validators.propertySelector
        }, {
            key: 'magnetUrlProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            },
            asyncValidators: validators.propertySelector
        }, {
            key: 'torrentUrlSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                label: ".torrent URL selector (hyperlink to the torrent file)",
                type: "text"
            },
            asyncValidators: validators.propertySelector
        }, {
            key: 'torrentUrlProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            },
            asyncValidators: validators.propertySelector
        }, {
            key: 'sizeSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                required: true,
                label: "Size Selector (element that has the Torrent's size)",
                type: "text"
            },
            asyncValidators: validators.propertySelector
        }, {
            key: 'sizeProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                required: true,
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            },
            asyncValidators: validators.attributeSelector
        }, {
            key: 'seederSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                required: true,
                label: "Seeders Selector (element that has the 'seeders')",
                type: "text"
            },
            asyncValidators: validators.propertySelector
        }, {
            key: 'seederProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                required: true,
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            },
            asyncValidators: validators.attributeSelector
        }, {
            key: 'leecherSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                required: true,
                label: "Leechers Selector (element that has the 'leechers')",
                type: "text"
            },
            asyncValidators: validators.propertySelector
        }, {
            key: 'leecherProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                required: true,
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            },
            asyncValidators: validators.attributeSelector
        }, {
            key: 'detailUrlSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                required: true,
                label: "Detail URL Selector (page that opens in new tab and shows detail page for torrent)",
                type: "text"
            },
            asyncValidators: validators.propertySelector
        }, {
            key: 'detailUrlProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                required: true,
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            },
            asyncValidators: validators.attributeSelector
        }];
        pageLog("Loaded formly fields");

        var output = [];
        for (var key = 0; key < this.fields.length; key++) {
            var field = this.fields[key];
            if (field.fieldGroup) {
                output.push(field);
                continue;

            }
            var fieldgroup = [];

            // full-row width inputs
            if (!field.className) {
                field.className = 'col-xs-9';
            }
            field.modelOptions = {
                updateOn: 'keyup',
                debounce: 200
            };

            // cse selector fields are the big text inputs. make them 8 units wide, and add the 
            if (field.className == 'cseSelector') {
                field.className += ' col-xs-6';
                fieldgroup.push(field);
                var nextField = this.fields[key + 1];
                nextField.className += ' col-xs-3';
                fieldgroup.push(nextField);
                key++;
            } else {
                fieldgroup.push(field);
            }

            // add testresult column for each row 
            fieldgroup.push({
                className: 'col-xs-3',
                template: "<div style='padding-top:35px; word-break:break-all; font-family:courier'><i class='glyphicon glyphicon-ok'></i> {{ model.infoMessages." + field.key + " }} " + (nextField ? "</p><p>{{ model.infoMessages." + nextField.key + "}}" : '') + "</p></div>",
            });

            var row = {
                className: "row",
                fieldGroup: fieldgroup
            };

            if (field.key == 'magnetUrlSelector') {
                row.hideExpression = '!model.magnetSupported';
            }
            if (field.key == 'torrentUrlSelector') {
                row.hideExpression = '!model.magnetSupported';
            }
            if (field.key == 'loginPage') {
                row.hideExpression = '!model.loginRequired';
            }
            // now append each row to the output
            output.push(row);
        }

        this.fields = output;

        this.testResults = {
            'searchResultsContainer': 'woei'

        };

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };
    }
]);