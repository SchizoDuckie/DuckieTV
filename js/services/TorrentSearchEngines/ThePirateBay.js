DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('ThePirateBay', new GenericTorrentSearchEngine({
                mirror: 'https://thepiratebay.org',
                mirrorSettingsKey: 'ThePirateBay.mirror',
                mirrorResolver: 'ThePirateBayMirrorResolver',
                includeBaseURL: true,
                endpoints: {
                    search: '/search/%s/0/%o/0'
                },
                selectors: {
                    resultContainer: '#searchResult tbody tr',
                    releasename: ['td:nth-child(2) > div', 'innerText'],
                    magnetUrl: ['td:nth-child(2) > a', 'href'],
                    size: ['td:nth-child(2) .detDesc', 'innerText',
                        function(text) {
                            return text.split(', ')[1].split(' ')[1].replace('i', '');
                        }
                    ],
                    seeders: ['td:nth-child(3)', 'innerHTML'],
                    leechers: ['td:nth-child(4)', 'innerHTML'],
                    detailUrl: ['a.detLink', 'href']
                },
                orderby: {
                    leechers: {d: '9', a: '10'},
                    seeders: {d: '99', a: '8'},
                    size: {d: '5', a: '6'}
                }
            }, $q, $http, $injector));
        }
    }
]);