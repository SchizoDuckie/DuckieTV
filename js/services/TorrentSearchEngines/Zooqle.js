DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('Zooqle', new GenericTorrentSearchEngine({
                mirror: 'https://zooqle.com',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/search?q=%s&s=%o&v=t',
                    details: '%s'
                },
                selectors: {
                    resultContainer: 'tr ',
                    releasename: ['td:nth-child(2) > a', 'innerText'],
                    magnetUrl: ['a[title^="Magnet link"]', 'href',
                        function(href) {
                            return href + '&tr=udp://tracker.coppersurfer.tk:6969/announce&tr=udp://9.rarbg.me:2780/announce&tr=udp://9.rarbg.to:2710/announce&tr=udp://9.rarbg.com:2740/announce&tr=udp://eddie4.nl:6969/announce&tr=udp://tracker.leechers-paradise.org:6969/announce&tr=udp://explodie.org:6969/announce&tr=udp://p4p.arenabg.ch:1337/announce';
                        }
                    ],
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
                detailsSelectors: {
                    detailsContainer: '#torrent',
                    magnetUrl: ['#dlPanel a:nth-of-type(1)', 'href']
                },
                orderby: {
                    age: {d: 'dt&sd=d', a: 'dt&sd=a'},
                    seeders: {d: 'ns&sd=d', a: 'ns&sd=a'},
                    size: {d: 'sz&sd=d', a: 'sz&sd=a'}
                }
            }, $q, $http, $injector));
        }
    }
]);