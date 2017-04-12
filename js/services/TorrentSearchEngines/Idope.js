DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('Idope', new GenericTorrentSearchEngine({
                mirror: 'https://idope.se',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/torrent-list/%s/?&o=%o'
                },
                selectors: {
                    resultContainer: 'div.resultdiv',
                    releasename: ['div.resultdivtopname', 'innerText'],
                    seeders: ['div.resultdivbottonseed', 'innerText'],
                    leechers: ['div.resultdivbottonseed', 'innerText',
                        function(text) {
                            return 'n/a';
                        }
                    ],
                    size: ['div.resultdivbottonlength', 'innerText'],
                    detailUrl: ['div.resultdivtop a', 'href'],
                    magnetUrl: ['.hideinfohash', 'innerText',
                        function(href) {
                            var magnetHash = href.match(/([0-9ABCDEFabcdef]{40})/);
                            return 'magnet:?xt=urn:btih:' + magnetHash[0] + TorrentSearchEngines.trackers;
                        }
                    ]
                },
                orderby: {
                    seeders: {
                        d: '-1',
                        a: '1'
                    },
                    size: {
                        d: '-2',
                        a: '2'
                    }
                }
            }, $q, $http, $injector));
        }

    }
]);