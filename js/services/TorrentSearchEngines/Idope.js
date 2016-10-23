DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('Idope', new GenericTorrentSearchEngine({
                mirror: 'https://www.idope.se',
                mirrorResolver: null,
                includeBaseURL: true,
                noMagnet: true,
                endpoints: {
                    search: '/torrent/%s/?&o=%o',
                    details: '%s'
                },
                selectors: {
                    resultContainer: 'div.resultdiv',
                    releasename: ['div.resultdivtopname', 'innerText'],
                    seeders: ['div.resultdivbottonseed', 'innerText'],
                    leechers:  ['div.resultdivbottonseed', 'innerText',
                        function(text) {
                            return 'n/a';
                        }
                    ],
                    size: ['div.resultdivbottonlength', 'innerText'],
                    detailUrl: ['div.resultdivtop a', 'href']
                },
                detailsSelectors: {
                    detailsContainer: '#attributediv',
                    magnetUrl: ['#mangetinfo', 'href',
                        function(href) {
                            return href + TorrentSearchEngines.trackers;
                        }
                    ],
                },
                orderby: {
                    age: {d: '-3', a: '3'},
                    seeders: {d: '-1', a: '1'},
                    size: {d: '-2', a: '2'}
                }
            }, $q, $http, $injector));
        }
    }
]);
