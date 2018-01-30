DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('ETag', new GenericTorrentSearchEngine({
                mirror: 'https://extratorrent.ag',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/search/?search=%s&srt=%o'
                },
                selectors: {
                    resultContainer: 'tr[class^="tl"]',
                    releasename: ['td.tli a', 'innerText'],
                    magnetUrl: ['td a[href^="magnet:?xt="]', 'href'],
                    seeders: ['td:nth-last-of-type(2)', 'innerText',
                        function(text) {
                            return (text == '---') ? null : text;
                        }
                    ],
                    leechers: ['td:nth-last-of-type(3)', 'innerText',
                        function(text) {
                            return (text == '---') ? null : text;
                        }
                    ],
                    size: ['td:nth-last-of-type(4)', 'innerText'],
                    detailUrl: ['td.tli a', 'href']
                },
                orderby: {
                    seeders: {d: 'seeds&order=desc', a: 'seeds&order=desc'},
                    leechers: {d: 'leechers&order=desc', a: 'leechers&order=desc'},
                    size: {d: 'size&order=desc', a: 'size&order=desc'}
                }
            }, $q, $http, $injector));
        }
    }
]);
