DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('TGx', new GenericTorrentSearchEngine({
                mirror: 'https://torrentgalaxy.org',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/torrents.php?search=%s&lang=0&sort=%o'
                },
                selectors: {
                    resultContainer: 'div[class="tgxtablerow clickable-row click"] ',
                    releasename: ['div.tgxtablecell:nth-child(3) div a', 'title'],
                    magnetUrl: ['div.tgxtablecell:nth-child(4) a:nth-child(2)', 'href'],
                    size: ['div.tgxtablecell:nth-child(7) span', 'innerText'],
                    seeders: ['div.tgxtablecell:nth-child(10) span font b', 'innerText'],
                    leechers: ['div.tgxtablecell:nth-child(10) span font:nth-child(2) b', 'innerText'],
                    detailUrl: ['div.tgxtablecell:nth-child(3) div a', 'href']
                },
                orderby: {
                    seeders: {d: 'seeders&order=desc', a: 'seeders&order=asc'},
                    size: {d: 'size&order=desc', a: 'size&order=asc'}
                }
            }, $q, $http, $injector));
        }
    }
]);