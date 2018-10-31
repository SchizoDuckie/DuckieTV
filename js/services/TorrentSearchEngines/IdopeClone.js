DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('IdopeClone', new GenericTorrentSearchEngine({
                mirror: 'https://www.idope.site',
                mirrorResolver: null,
                includeBaseURL: false,
                endpoints: {
                    search: '/search/%s/'
                },
                selectors: {
                    resultContainer: 'li',
                    releasename: ['div.opt-text-w3layouts a', 'innerText'],
                    detailUrl: ['div.opt-text-w3layouts a', 'href'],
                    seeders: ['div.seedbar span:nth-child(1)', 'innerText',
                        function(text) {
                            return text.replace('Seed: ', '');
                        }
                    ],
                    leechers: ['div.seedbar span:nth-child(2)', 'innerText',
                        function(text) {
                            return text.replace('Leech: ', '');
                        }
                    ],
                    size: ['div.seedbar span:nth-child(3)', 'innerText',
                        function(text) {
                            return text.replace('Size: ', '');
                        }
                    ],
                    magnetUrl: ['a[href^="magnet:?"]', 'href']
                }
            }, $q, $http, $injector));
        }

    }
]);