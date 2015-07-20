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
                searchResultsContainer: '#torrenttable tr',
                releaseNameSelector: 'td.name .title a',
                releaseNameProperty: 'innerText',
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
                detailUrlProperty: 'href'
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
        }
        // Enabling currently does nothing atm
        this.enable = function(name) {
            TorrentSearchEngines.enableSearchEngine(name);
        }

        this.openDialog = function(index, addNew) {
            // Opens dialog and sends list of current engines and the index of the one we are editing
            dialogs.create('templates/customSearchEngineDialog.html', 'customSearchEngineDialogCtrl as cse', {
                engine: self.customEngines[Object.keys(self.customEngines)[index]],
                isNew: addNew
            }, {
                size: 'lg'
            });
        }
    }
])

.controller('customSearchEngineDialogCtrl', ['$scope', "$injector", "$http", "$q", "$modalInstance", "data", "TorrentSearchEngines",
    function($scope, $injector, $http, $q, $modalInstance, data, TorrentSearchEngines) {

        var self = this;
        this.isNew = data.isNew;

        // Function to push log messages onto the page, pushes new message to top of array
        this.pageLog = [];
        var pageLog = function(message) {
            if (message) {
                self.pageLog.unshift(message);
            }
        }

        pageLog("Initializing");

        if (data.engine && !data.isNew) {
            pageLog("Engine detected that isn't new, editing mode");
            this.model = data.engine;
        } else if (data.isNew) {
            pageLog("New engine detected, adding mode");
            this.model = undefined;
        }

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



        var testCollection = function() {
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

            pageLog("Executing test search");
            return testClient.executeSearch(self.model.testSearch).then(function(result) {
                var d = new HTMLScraper(result.data);
                var results = d.querySelectorAll(this.model.searchResultsContainer).length;
                console.log("# results found for test search: ", results);
                return results;
            });
        };

        this.test = function() {
            pageLog("Creating testing client");
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

            pageLog("Executing test search");
            testClient.search(self.model.testSearch).then(function(results) {
                results.length > 0 ? pageLog("Test search working!") : pageLog("No results for search query :(");
                $scope.$applyAsync();
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
        }];

        pageLog("Loaded Attribute Whitelist");

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
                label: "Results selector (CSS selector that returns a base element for all search results)",
                type: "text",
                modelOptions: {
                    updateOn: 'keypress'
                },
            }
        }, {
            key: 'releaseNameSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                required: true,
                label: "Release name Selector (within base element)",
                type: "text"
            }
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
            key: 'magnetUrlSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                label: "magnet URL selector (hyperlink to the magnet url)",
                type: "text"
            }
        }, {
            key: 'magnetUrlProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            }
        }, {
            key: 'torrentUrlSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                label: ".torrent URL selector (hyperlink to the torrent file)",
                type: "text"
            }
        }, {
            key: 'torrentUrlProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            }
        }, {
            key: 'sizeSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                required: true,
                label: "Size Selector (element that has the Torrent's size)",
                type: "text"
            }
        }, {
            key: 'sizeProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                required: true,
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            }
        }, {
            key: 'seederSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                required: true,
                label: "Seeders Selector (element that has the 'seeders')",
                type: "text"
            }
        }, {
            key: 'seederProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                required: true,
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            }
        }, {
            key: 'leecherSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                required: true,
                label: "Leechers Selector (element that has the 'leechers')",
                type: "text"
            }
        }, {
            key: 'leecherProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                required: true,
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            }
        }, {
            key: 'detailUrlSelector',
            className: 'cseSelector',
            type: "input",
            templateOptions: {
                required: true,
                label: "Detail URL Selector (page that opens in new tab and shows detail page for torrent)",
                type: "text"
            }
        }, {
            key: 'detailUrlProperty',
            className: 'cseProperty',
            type: "select",
            templateOptions: {
                required: true,
                label: "Attribute",
                valueProp: 'name',
                options: attributeWhitelist
            }
        }];
        pageLog("Loaded formly fields");

        var output = [];
        for (var key = 0; key < this.fields.length; key++) {
            var field = this.fields[key];
            var fieldgroup = [];

            // full-row width inputs
            if (!field.className) {
                field.className = 'col-xs-10';
            }

            // cse selector fields are the big text inputs. make them 8 units wide, and add the 
            if (field.className == 'cseSelector') {
                field.className = 'col-xs-8';
                fieldgroup.push(field);
                var nextField = this.fields[key + 1];
                nextField.className = 'col-xs-2';
                fieldgroup.push(nextField);
                key++;
            } else {
                fieldgroup.push(field);
            }

            // add testresult column for each row 
            fieldgroup.push({
                className: 'col-xs-2',
                template: "<p style='padding-top:35px'><i class='glyphicon glyphicon-ok'></i> Test result</p>"
            });

            // now append each row to the output
            output.push({
                className: "row",
                fieldGroup: fieldgroup
            });
        }

        output.validators = {
            searchResultsContainer: {
                expression: function($viewValue, $modelValue, scope) {
                    scope.options.templateOptions.loading = true;
                    return testCollection().then(function(result) {
                        if (!result) {
                            throw new Error("invalid test search.");
                        }
                        if (result.length == 0) {
                            throw new Error("0 results found");
                        } else {
                            pagelog(result + " results found for test search!");
                        }
                        console.log(result);

                    });
                },
                message: '"This username is already taken."'
            }
        };
        this.fields = output;

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };
    }
]);