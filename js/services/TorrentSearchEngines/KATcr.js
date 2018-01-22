DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('KATcr', new GenericTorrentSearchEngine({
                mirror: 'https://katcr.co/',
                mirrorResolver: null,
                includeBaseURL: false,
                endpoints: {
                    search: 'katsearch/page/1/%s'
                },
                selectors: {
                    resultContainer: 'table.torrents_table > tbody > tr',
                    releasename: ['a.torrents_table__torrent_title b', 'innerText'],
                    size: ['td[data-title="Size"]', 'innerText'],
                    seeders: ['td[data-title="Seed"]', 'innerText'],
                    leechers: ['td[data-title="Leech"]', 'innerText'],
                    magnetUrl: ['a[href^="magnet:?xt="]', 'href'],
                    detailUrl: ['a.torrents_table__torrent_title', 'href']
                }
            }, $q, $http, $injector));
        }

    }
]);