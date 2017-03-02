DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('Zooqle', new GenericTorrentSearchEngine({
                mirror: 'https://zooqle.com',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/search?q=%s&s=%o&v=t'
                },
                selectors: {
                    resultContainer: 'tr ',
                    releasename: ['td:nth-child(2) > a', 'innerText'],
                    magnetUrl: ['a[title^="Magnet link"]', 'href'],
                    size: ['td:nth-child(4)', 'innerText',
                        function(text) {
                            return (text == '– N/A –') ? null : text;
                        }
                    ],
                    seeders: ['div[title^="Seeders:"]', 'title',
                        function(text) {
                            var textPart = text.split(/[\:\|]/);
                            return textPart[1].trim();
                        }
                    ],
                    leechers: ['div[title^="Seeders:"]', 'title',
                        function(text) {
                            var textPart = text.split(/[\:\|]/);
                            return textPart[3].trim();
                        }
                    ],
                    detailUrl: ['td:nth-child(2) > a', 'href']
                },
                orderby: {
                    seeders: {d: 'ns&sd=d', a: 'ns&sd=a'},
                    size: {d: 'sz&sd=d', a: 'sz&sd=a'}
                }
            }, $q, $http, $injector));
        }
    }
]);