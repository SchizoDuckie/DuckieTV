DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('IsoHunt', new GenericTorrentSearchEngine({
                mirror: 'https://isohunt.to',
                mirrorResolver: null, 
                includeBaseURL: true,
                endpoints: {
                    search: '/torrents/?ihq=%s&Torrent_sort=%o',
                    details: '%s'
                },
                selectors: {
                    resultContainer: 'div[id="serps"] table tbody tr',
                    releasename: ['td:nth-child(2) a span', 'innerText'],
                    magnetUrl: ['a[title="BitLord streaming"]', 'data-href',
                        function(href) {
                            return href.replace('torrentstream','magnet') + TorrentSearchEngines.trackers;
                        }
                    ],
                    size: ['td:nth-child(6)', 'innerText'],
                    seeders: ['td:nth-child(7)', 'innerHTML'],
                    leechers:  ['td:nth-child(7)', 'innerHTML',
                        function(text) {
                            return 'n/a';
                        }
                    ],
                    detailUrl: ['td:nth-child(2) a', 'href']
                },
                detailsSelectors: {
                    detailsContainer: 'div[class="row mt"]',
                    magnetUrl: ['a:nth-of-type(2)', 'href']
                },
                orderby: {
                    age: {d: '-created_at', a: 'created_at'},
                    seeders: {d: '-seeders', a: 'seeders'},
                    size: {d: '-size', a: 'size'}
                }
            }, $q, $http, $injector));
        }

    }
]);