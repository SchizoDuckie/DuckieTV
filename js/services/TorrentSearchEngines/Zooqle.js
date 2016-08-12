DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('Zooqle', new GenericTorrentSearchEngine({
                mirror: 'https://zooqle.com',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/search?q=%s&s=%o&v=t&sd=d',
                    details: '%s'
                },
                selectors: {
                    resultContainer: 'tr ',
                    releasename: ['td:nth-child(2) > a', 'innerText'],
                    magneturl: ['a[title^="Magnet link"', 'href',
                        function(a) {
                            return a + '&tr=udp://tracker.coppersurfer.tk:6969/announce&tr=udp://9.rarbg.me:2780/announce&tr=udp://9.rarbg.to:2710/announce&tr=udp://9.rarbg.com:2740/announce&tr=udp://eddie4.nl:6969/announce&tr=udp://tracker.leechers-paradise.org:6969/announce&tr=udp://explodie.org:6969/announce&tr=udp://p4p.arenabg.ch:1337/announce';
                        }
                    ],
                    size: ['td:nth-child(4)', 'innerText',
                        function(a) {
                            return (a == '– N/A –') ? null : a;
                        }],
                    seeders: ['td:nth-child(6) div div:first-child', 'innerText',
                        function(a) {
                            return (a[a.length-1] == 'K') ? parseInt(a) * 1000 : a;
                        }],
                    leechers: ['td:nth-child(6) div div:last-child', 'innerText',
                        function(a) {
                            return (a[a.length-1] == 'K') ? parseInt(a) * 1000 : a;
                        }],
                    detailUrl: ['td:nth-child(2) > a', 'href']
                },
                orderby: {
                    age: 'dt',
                    seeders: 'ns', 
                    size: 'sz'
                }
            }, $q, $http, $injector));
        }
    }
]);