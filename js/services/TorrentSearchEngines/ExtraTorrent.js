DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('ExtraTorrent', new GenericTorrentSearchEngine({
                mirror: 'https://extra.to',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/search/?search=%s&s_cat=&pp=&srt=%o'
                },
                selectors: {
                    resultContainer: 'tr[class^="tl"]',
                    releasename: ['td.tli a', 'innerText'],
                    magnetUrl: ['td a:nth-of-type(2)', 'href'],
                    torrentUrl: ['td a', 'href'],
                    seeders: ['td.sy', 'innerText'],
                    leechers: ['td.ly', 'innerText'],
                    size: ['td:nth-of-type(5)', 'innerText'],
                    detailUrl: ['td.tli a', 'href']
                },
                orderby: {
                    seeders: {d: 'seeds&order=desc', a: 'seeds&order=asc'},
                    leechers: {d: 'leechers&order=desc', a: 'leechers&order=asc'},
                    size: {d: 'size&order=desc', a: 'size&order=asc'}
                }
            }, $q, $http, $injector));
        }
    }
]);
