DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('ExtraTorrent', new GenericTorrentSearchEngine({
                mirror: 'https://extratorrent.cc',
                mirrorResolver: null,
                includeBaseURL: true,
                noMagnet: true,
                endpoints: {
                    search: '/advanced_search/?with=%s',
                    details: '%s'
                },
                selectors: {
                    resultContainer: 'table.tl tr[class]',
                    releasename: ['td.tli > a', 'innerText'],
                    magneturl: [], // Requires fetching details
                    size: ['td:nth-of-type(4)', 'innerText'],
                    seeders: ['td.sy', 'innerText'],
                    leechers: ['td.ly', 'innerText',
                        function(a) {
                            return a ? a : 'n/a';
                        }
                    ],
                    detailUrl: ['td.tli > a', 'href'],
                    torrentUrl: ['td:first-of-type a', 'href']
                }
            }, $q, $http, $injector));
        }
    }
]);
