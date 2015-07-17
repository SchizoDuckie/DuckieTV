DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('ThePirateBay', new GenericTorrentSearchEngine({
                mirror: 'https://thepiratebay.cr',
                mirrorSettingsKey: 'ThePirateBay.mirror',
                mirrorResolver: 'MirrorResolver',
                includeBaseURL: true,
                endpoints: {
                    search: '/search/%s/0/7/0',
                    details: '/torrent/%s'
                },
                selectors: {
                    resultContainer: '#searchResult tbody tr',
                    releasename: ['td:nth-child(2) > div', 'innerText',
                        function(text) {
                            return text.trim();
                        }
                    ],
                    magneturl: ['td:nth-child(2) > a', 'href'],
                    size: ['td:nth-child(2) .detDesc', 'innerText',
                        function(innerText) {
                            return innerText.split(', ')[1].split(' ')[1];
                        }
                    ],
                    seeders: ['td:nth-child(3)', 'innerHTML'],
                    leechers: ['td:nth-child(4)', 'innerHTML'],
                    detailUrl: ['a.detLink', 'href'],
                }
            }, $q, $http, $injector));
        }
    }
]);