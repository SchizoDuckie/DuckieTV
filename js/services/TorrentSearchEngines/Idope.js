DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('Idope', new GenericTorrentSearchEngine({
                mirror: 'https://www.idope.se',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/torrent/%s/?&o=%o',
                    details: '%s'
                },
                selectors: {
                    resultContainer: '#div2',
                    releasename: ['div.resultdivtopname', 'innerText'],
                    seeders: ['div.resultdivbottonseed', 'innerText'],
                    leechers:  ['div.resultdivbottonseed', 'innerText',
                        function(text) {
                            return 'n/a';
                        }
                    ],
                    size: ['div.resultdivbottonlength', 'innerText'],
                    magnetUrl: ['a', 'href',
                        function(href) {
                            var magnetHash = href.match(/([0-9ABCDEFabcdef]{40})/);
                            return 'magnet:?xt=urn:btih:' + magnetHash[0] + TorrentSearchEngines.trackers;
                        }
                    ],
                    detailUrl: ['a', 'href']
                },
                orderby: {
                    age: {d: '-3', a: '3'},
                    seeders: {d: '-1', a: '1'},
                    size: {d: '-2', a: '2'}
                }
            }, $q, $http, $injector));
        }
    }
]);
