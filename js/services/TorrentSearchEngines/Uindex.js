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
                    resultContainer: 'table.sr-table > tbody > tr:has(a[href^="magnet:?xt="]',
                    releasename: ['a[href^="/details.php?id="]', 'innerText'],
                    seeders: ['td.sr-col-seeders', 'innerText'],
                    leechers: ['td.sr-col-leechers', 'innerText'],
                    size: ['td.sr-col-size', 'innerText'],
                    detailUrl: ['a[href^="/details.php?id="]', 'href'],
                    magnetUrl: ['a[href^="magnet:?xt="]', 'href']
                },
            }, $q, $http, $injector));
        }

    }
]);
