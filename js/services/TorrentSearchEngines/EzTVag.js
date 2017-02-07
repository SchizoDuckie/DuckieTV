DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('EzTV.ag', new GenericTorrentSearchEngine({
                mirror: 'https://eztv.ag/',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: 'search/%s'
                },
                selectors: {
                    resultContainer: 'table.forum_header_border tr.forum_header_border',
                    releasename: ['td > a.epinfo', 'innerText'],
                    magnetUrl: ['td > a.magnet', 'href'],
                    torrentUrl: ['td:nth-child(3) a:nth-child(2)', 'href'],
                    size: ['td:nth-child(4)', 'innerText'],
                    seeders: ['td:nth-child(6)', 'innerText'],
                    leechers: ['td:nth-child(6)', 'innerText', function(a) {
                        return 'n/a';
                    }],
                    detailUrl: ['td.forum_thread_post > a.epinfo', 'href']
                }
            }, $q, $http, $injector));
        }
    }
]);