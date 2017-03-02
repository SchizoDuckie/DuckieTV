DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('SkyTorrents', new GenericTorrentSearchEngine({
                mirror: 'https://www.skytorrents.in',
                includeBaseURL: true,
                endpoints: {
                    search: '/search/all/%o/1/?q=%s'
                },
                selectors: {
                    resultContainer: 'table tbody tr',
                    releasename: ['td:nth-child(1) a:nth-child(1)', 'innerText'],
                    torrentUrl: ['td:nth-child(1) a:nth-of-type(2)', 'href'],
                    magnetUrl: ['td:nth-child(1) a:nth-of-type(3)', 'href'],
                    size: ['td:nth-child(2)', 'innerText'],
                    seeders: ['td:nth-child(5)', 'innerText'],
                    leechers: ['td:nth-child(6)', 'innerText'],
                    detailUrl: ['td:nth-child(1) a:nth-child(1)', 'href']
                },
                orderby: {
                    leechers: {d: 'pd', a: 'pa'},
                    seeders: {d: 'ed', a: 'ea'},
                    size: {d: 'sd', a: 'sa'}
                }
            }, $q, $http, $injector));
        }
    }
]);
