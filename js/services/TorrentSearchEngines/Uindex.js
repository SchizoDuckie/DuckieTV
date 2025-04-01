DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('Uindex', new GenericTorrentSearchEngine({
                mirror: SettingsService.get('mirror.Uindex'),
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/search.php?search=%s'
                },
                selectors: {
                    resultContainer: 'table.maintable > tbody > tr:has(a[href^="magnet:?xt="]',
                    releasename: ['a[href^="/details.php?id="]', 'innerText'],
                    seeders: ['td:nth-child(4)', 'innerText'],
                    leechers: ['td:nth-child(5)', 'innerText'],
                    size: ['td:nth-child(3)', 'innerText'],
                    detailUrl: ['a[href^="/details.php?id="]', 'href'],
                    magnetUrl: ['a[href^="magnet:?xt="]', 'href']
                },
            }, $q, $http, $injector));
        }

    }
]);
