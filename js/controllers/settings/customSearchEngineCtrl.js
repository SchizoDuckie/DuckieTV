DuckieTV.controller("customSearchEngineCtrl", ["SettingsService", "TorrentSearchEngines", "$q", "$http", "$injector", "$scope",
    function(SettingsService, TorrentSearchEngines, $q, $http, $injector, $scope) {

        var self = this;
        self.status = 'Idle';
        this.editMode = false;
        this.currentlySelected = null;
        this.model = null;

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
                seederProperty: 'innerHTML',
                leecherSelector: 'td.leechers',
                leecherProperty: 'innerHTML',
                detailUrlSelector: 'td.name .title a',
                detailUrlProperty: 'href'
            },
            'Test 1': {
                testSearch: 'test',
                name: 'Torrentleech2.org',
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
                seederProperty: 'innerHTML',
                leecherSelector: 'td.leechers',
                leecherProperty: 'innerHTML',
                detailUrlSelector: 'td.name .title a',
                detailUrlProperty: 'href'
            },
            'Test 2': {
                testSearch: 'test',
                name: 'Torrentleech3.org',
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
                seederProperty: 'innerHTML',
                leecherSelector: 'td.leechers',
                leecherProperty: 'innerHTML',
                detailUrlSelector: 'td.name .title a',
                detailUrlProperty: 'href'
            }
        };

        var attributeWhitelist = [{
            name: 'href',
        }, {
            name: 'innerHTML',
        }, {
            name: 'innerText',
        }, {
            name: 'title',
        }, {
            name: 'src',
        }];

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
                type: "input",
                templateOptions: {
                    label: "Release name Selector (within base element)",
                    type: "text"
                }
            }, {
                key: 'releaseNameProperty',
                type: "select",
                templateOptions: {
                    label: "Release name attribute",
                    valueProp: 'name',
                    options: attributeWhitelist
                }
            }, {
                key: 'torrentUrlSelector',
                type: "input",
                templateOptions: {
                    label: ".torrent URL selector (hyperlink to the torrent file)",
                    type: "text"
                }
            }, {
                key: 'torrentUrlProperty',
                type: "input",
                templateOptions: {
                    label: ".torrent URL attribute",
                    valueProp: 'name',
                    options: attributeWhitelist
                }
            }, {
                key: 'sizeSelector',
                type: "input",
                templateOptions: {
                    label: "Size Selector (element that has the Torrent's size)",
                    type: "text"
                }
            }, {
                key: 'sizeProperty',
                type: "input",
                templateOptions: {
                    label: "Size attribute",
                    valueProp: 'name',
                    options: attributeWhitelist
                }
            }, {
                key: 'seederSelector',
                type: "input",
                templateOptions: {
                    label: "Seeders Selector (element that has the 'seeders')",
                    type: "text"
                }
            }, {
                key: 'seederProperty',
                type: "input",
                templateOptions: {
                    label: "Seeders attribute",
                    valueProp: 'name',
                    options: attributeWhitelist
                }
            }, {
                key: 'leecherSelector',
                type: "input",
                templateOptions: {
                    label: "Leechers Selector (element that has the 'leechers')",
                    type: "text"
                }
            }, {
                key: 'leecherProperty',
                type: "input",
                templateOptions: {
                    label: "Leechers attribute",
                    valueProp: 'name',
                    options: attributeWhitelist
                }
            }, {
                key: 'detailUrlSelector',
                type: "input",
                templateOptions: {
                    label: "Detail URL Selector (page that opens in new tab and shows detail page for torrent)",
                    type: "text"
                }
            }, {
                key: 'detailUrlProperty',
                type: "input",
                templateOptions: {
                    label: "Detail URL attribute",
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

        this.test = function() {

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

        this.selectEngine = function(index) {
            if (this.currentlySelected == index) {
                this.editMode = false;
                return;
            }
            this.currentlySelected = index;
            this.model = angular.copy(this.customEngines[Object.keys(this.customEngines)[index]]);
            this.editMode = true;
        };

        this.addNew = function() {
            
        };

        this.add = function() {
            TorrentSearchEngines.registerSearchEngine(this.model.name,
                new GenericTorrentSearchEngine({
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
                }, $q, $http, $injector));

            this.status = 'Done! check the torrent dialog!';

        }
    }
]);