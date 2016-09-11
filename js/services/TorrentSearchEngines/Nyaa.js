DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('Nyaa', new GenericTorrentSearchEngine({
                mirror: 'https://www.nyaa.se',
                mirrorResolver: null,
                endpoints: {
                    search: '/?page=search&sort=%o&term=%s'
                },
                noMagnet: true,
                selectors: {
                    resultContainer: 'tr.tlistrow',
                    releasename: ['td.tlistname a', 'innerText'],
                    torrentUrl: ['td.tlistdownload a', 'href',
                        function(a) {
                            return 'https:' + a;
                        }
                    ],
                    size: ['td.tlistsize', 'innerText'],
                    seeders: ['td.tlistsn', 'innerHTML'],
                    leechers: ['td.tlistln', 'innerHTML'],
                    detailUrl: ['td.tlistname a', 'href',
                        function(a) {
                            return 'https:' + a;
                        }
                    ]
                },
                noDetailsMagnet: true,
                orderby: {
                    age: {d: '1', a: '1&order=2'},
                    leechers: {d: '3', a: '3&order=2'},
                    seeders: {d: '2', a: '2&order=2'},
                    size: {d: '5', a: '5&order=2'}
                }
            }, $q, $http, $injector));
        }
    }
]);
