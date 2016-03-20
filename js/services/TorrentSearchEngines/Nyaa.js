DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('Nyaa', new GenericTorrentSearchEngine({
                mirror: 'https://www.nyaa.se',
                mirrorResolver: null,
                endpoints: {
                    search: '/?page=search&sort=2&term=%s'
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
                }
            }, $q, $http, $injector));
        }
    }
]);
