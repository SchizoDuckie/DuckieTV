DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('KATcr', new GenericTorrentSearchEngine({
                mirror: 'https://katcr.co/new/',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: 'torrents-search.php?search=%s&sort=%o'
                },
                selectors: {
                    resultContainer: 'tr[class="t-row"]',
                    releasename: ['td:first-child div.torrentname div a.cellMainLink', 'innerText'],
                    size: ['td:nth-child(2)', 'innerText'],
                    seeders: ['td:nth-child(4)', 'innerText'],
                    leechers: ['td:nth-child(5)', 'innerText'],
                    torrentUrl: ['td:first-child div[class^="iaconbox"] a:nth-child(3)', 'href'],
                    detailUrl: ['td:first-child div[class^="iaconbox"] a:nth-child(2)', 'href']
                },
                detailsSelectors: {
                    detailsContainer: 'table tr td div[class="myFrame torrent-title"]',
                    magnetUrl: ['a[title="Magnet link"]', 'href']
                },
                orderby: {
                    age: {d: 'id&order=desc', a: 'id&order=asc'},
                    seeders: {d: 'seeders&order=desc', a: 'seeders&order=asc'},
                    leechers: {d: 'leechers&order=desc', a: 'leechers&order=asc'},
                    size: {d: 'size&order=desc', a: 'size&order=asc'}
                }
            }, $q, $http, $injector));
        }

    }
]);