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
                    magneturl: ['a[title^="Magnet link"', 'href'],
                    size: ['div.progress-bar.prog-blue', 'innerText'],
                    seeders: ['div.progress-bar.prog-green', 'innerText',
                        function(a) {
                            return (a[a.length-1] == 'K') ? parseInt(a) * 1000 : a;
                        }],
                    leechers: ['div.progress-bar.prog-yellow', 'innerText',
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