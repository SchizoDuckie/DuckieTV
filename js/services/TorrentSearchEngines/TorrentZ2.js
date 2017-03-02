DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('TorrentZ2', new GenericTorrentSearchEngine({
                mirror: 'https://torrentz2.eu',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/search%o?f=%s'
                },
                selectors: {
                    resultContainer: 'div.results dl',
                    releasename: ['dt a', 'innerText'],
                    magnetUrl: ['dt a', 'href',
                        function(href) {
                            return 'magnet:?xt=urn:btih:' + href.substring(1) + TorrentSearchEngines.trackers;
                        }
                    ],
                    size: ['dd span:nth-child(3)', 'innerText'],
                    seeders: ['dd span:nth-child(4)', 'innerText'],
                    leechers: ['dd span:nth-child(5)', 'innerText'],
                    detailUrl: ['dt a', 'href']
                },
                orderby: {
                    seeders: {d: '', a: ''},
                    size: {d: 'S', a: 'S'}
                }

            }, $q, $http, $injector));
        }
    }
]);