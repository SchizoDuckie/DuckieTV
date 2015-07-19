DuckieTV.controller("customSearchEngineCtrl", ["$scope", "$injector", "$http", "$q", "SettingsService", "TorrentSearchEngines", "dialogs",
    function($scope, $injector, $http, $q, SettingsService, TorrentSearchEngines, dialogs) {

        var self = this;
        self.status = 'Idle';
        this.editMode = false;
        this.currentlySelected = null;
        this.model = null;

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
                magnetUrlSelector: '',
                magnetUrlProperty: '',
                torrentUrlSelector: 'a[title="Torrent magnet link"]',
                torrentUrlProperty: 'href',
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
            this.model = angular.copy(this.customEngines[Object.keys(this.customEngines)[index]]);

            self.status = 'creating test client';

            //console.log("Testing settings");
            var testClient = new GenericTorrentSearchEngine({
                mirror: this.model.mirror, //'https://kat.cr',
                noMagnet: true,
                endpoints: {
                    search: this.model.searchEndpoint, //'/usearch/%s/?field=seeders&sorder=desc',
                    details: '/torrent/%s'
                },
                selectors: {
                    resultContainer: this.model.searchResultsContainer, //'table.data tr[id^=torrent]',
                    releasename: [this.model.releaseNameSelector, this.model.releaseNameProperty], //, ['div.torrentname a.cellMainLink', 'innerText'],
                    torrentUrl: [this.model.torrentUrlSelector, this.model.torrentUrlProperty], //['a[title="Torrent magnet link"]', 'href'],
                    size: [this.model.sizeSelector, this.model.sizeProperty], // ['td:nth-child(2)', 'innerText'],
                    seeders: [this.model.seederSelector, this.model.seederProperty], // ['td:nth-child(5)', 'innerHTML'],
                    leechers: [this.model.leecherSelector, this.model.leecherProperty], // ['td:nth-child(6)', 'innerHTML'],
                    detailUrl: [this.model.detailUrlSelector, this.model.detailUrlProperty] // ['div.torrentname a.cellMainLink', 'href']
                }
            }, $q, $http, $injector);

            self.status = "Executing test search";
            testClient.search(self.model.testSearch).then(function(results) {
                self.status = results.length > 0 ? 'Working!' : 'No results for search query :( ';
                $scope.$applyAsync();
            });
        };

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

.controller('customSearchEngineDialogCtrl', ['$scope', "$injector", "$http", "$q", "data", "TorrentSearchEngines",
    function($scope, $injector, $http, $q, data, TorrentSearchEngines) {

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

        // Not sure how this handles adding new ones but we need to check against adding engines with same name
        // to update it. Also TorrentSearchEngines currently doesn't support removing or enable/disable-ing engines
        this.add = function() {
            pageLog("Attempting to add new Engine");
            TorrentSearchEngines.registerSearchEngine(this.model.name, 
                new GenericTorrentSearchEngine({
                    mirror: this.model.mirror,
                    noMagnet: true,
                    endpoints: {
                        search: this.model.searchEndpoint,
                        details: '/torrent/%s'
                    },
                    selectors: {
                        resultContainer: this.model.searchResultsContainer,
                        releasename: [this.model.releaseNameSelector, this.model.releaseNameProperty],
                        torrentUrl: [this.model.torrentUrlSelector, this.model.torrentUrlProperty],
                        size: [this.model.sizeSelector, this.model.sizeProperty],
                        seeders: [this.model.seederSelector, this.model.seederProperty],
                        leechers: [this.model.leecherSelector, this.model.leecherProperty],
                        detailUrl: [this.model.detailUrlSelector, this.model.detailUrlProperty]
                    }
                }, $q, $http, $injector));
        }

        this.test = function() {
            pageLog("Creating testing client");

            var testClient = new GenericTorrentSearchEngine({
                mirror: this.model.mirror, //'https://kat.cr',
                noMagnet: true,
                endpoints: {
                    search: this.model.searchEndpoint, //'/usearch/%s/?field=seeders&sorder=desc',
                    details: '/torrent/%s'
                },
                selectors: {
                    resultContainer: this.model.searchResultsContainer, //'table.data tr[id^=torrent]',
                    releasename: [this.model.releaseNameSelector, this.model.releaseNameProperty], //, ['div.torrentname a.cellMainLink', 'innerText'],
                    torrentUrl: [this.model.torrentUrlSelector, this.model.torrentUrlProperty], //['a[title="Torrent magnet link"]', 'href'],
                    size: [this.model.sizeSelector, this.model.sizeProperty], // ['td:nth-child(2)', 'innerText'],
                    seeders: [this.model.seederSelector, this.model.seederProperty], // ['td:nth-child(5)', 'innerHTML'],
                    leechers: [this.model.leecherSelector, this.model.leecherProperty], // ['td:nth-child(6)', 'innerHTML'],
                    detailUrl: [this.model.detailUrlSelector, this.model.detailUrlProperty] // ['div.torrentname a.cellMainLink', 'href']
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
                    label: "Search Engine Name",
                    type: "text"
                }
            }, {
                key: 'mirror',
                type: "input",
                templateOptions: {
                    label: "Base URL for site (exclude the final /)",
                    type: "text"
                }
            }, {
                key: 'searchEndpoint',
                type: "input",
                templateOptions: {
                    label: "Search page url (use %s to inject search query)",
                    type: "text"
                }
            }, {
                key: 'searchResultsContainer',
                type: "input",
                templateOptions: {
                    label: "Results selector (CSS selector that returns a base element for all search results)",
                    type: "text"
                }
            }, {
                key: 'releaseNameSelector',
                className: 'cseSelector',
                type: "input",
                templateOptions: {
                    label: "Release name Selector (within base element)",
                    type: "text"
                }
            }, {
                key: 'releaseNameProperty',
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
                    label: "Size Selector (element that has the Torrent's size)",
                    type: "text"
                }
            }, {
                key: 'sizeProperty',
                className: 'cseProperty',
                type: "select",
                templateOptions: {
                    label: "Attribute",
                    valueProp: 'name',
                    options: attributeWhitelist
                }
            }, {
                key: 'seederSelector',
                className: 'cseSelector',
                type: "input",
                templateOptions: {
                    label: "Seeders Selector (element that has the 'seeders')",
                    type: "text"
                }
            }, {
                key: 'seederProperty',
                className: 'cseProperty',
                type: "select",
                templateOptions: {
                    label: "Attribute",
                    valueProp: 'name',
                    options: attributeWhitelist
                }
            }, {
                key: 'leecherSelector',
                className: 'cseSelector',
                type: "input",
                templateOptions: {
                    label: "Leechers Selector (element that has the 'leechers')",
                    type: "text"
                }
            }, {
                key: 'leecherProperty',
                className: 'cseProperty',
                type: "select",
                templateOptions: {
                    label: "Attribute",
                    valueProp: 'name',
                    options: attributeWhitelist
                }
            }, {
                key: 'detailUrlSelector',
                className: 'cseSelector',
                type: "input",
                templateOptions: {
                    label: "Detail URL Selector (page that opens in new tab and shows detail page for torrent)",
                    type: "text"
                }
            }, {
                key: 'detailUrlProperty',
                className: 'cseProperty',
                type: "select",
                templateOptions: {
                    label: "Attribute",
                    valueProp: 'name',
                    options: attributeWhitelist
                }
            }, {
                key: 'testSearch',
                type: "input",
                templateOptions: {
                    label: "Search query to use for testing",
                    type: "text"
                }
            },
        ];
        pageLog("Loaded formly fields");
    }
])