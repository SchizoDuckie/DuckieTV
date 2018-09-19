DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('IdopeClone', new GenericTorrentSearchEngine({
                mirror: 'https://idope.top',
                mirrorResolver: null,
                includeBaseURL: false,
                endpoints: {
                    search: '/search/%s/'
                },
                selectors: {
                    resultContainer: 'div.resultdiv',
                    releasename: ['div.resultdivtopname', 'innerText'],
                    detailUrl: ['div.magneticdiv a', 'href'],
                    seeders: ['div.resultdivbottonseed', 'innerText',
                        function(text) {
                            return null;
                        }
                    ],
                    leechers: ['div.resultdivbottonseed', 'innerText',
                        function(text) {
                            return null;
                        }
                    ],
                    size: ['div.resultdivbottonlength', 'innerText'],
                    magnetUrl: ['div.resultdivbottonseed', 'innerText',
                        function(text) {
                            return 'magnet:?xt=urn:btih:' + text + TorrentSearchEngines.trackers;
                        }
                    ]
                }
            }, $q, $http, $injector));
        }

    }
]);