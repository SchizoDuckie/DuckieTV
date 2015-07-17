DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('Nyaa', new GenericTorrentSearchEngine({
                mirror: 'http://www.nyaa.se',
                mirrorResolver: null,
                endpoints: {
                    search: '/?page=search&sort=2&term=%s'
                },
                noMagnet: true,
                selectors: {
                    resultContainer: 'tr.tlistrow',
                    releasename: ['td.tlistname a', 'innerText'],
                    torrentUrl: ['td.tlistdownload a', 'href'],
                    size: ['td.tlistsize', 'innerText'],
                    seeders: ['td.tlistsn', 'innerHTML'],
                    leechers: ['td.tlistln', 'innerHTML'],
                    detailUrl: ['td.tlistname a', 'href']
                }
            }, $q, $http, $injector));
        }
    }
]);