DuckieTV.run(["TorrentSearchEngines", "$q", "$http", "$injector",
    function(TorrentSearchEngines, $q, $http, $injector) {

        TorrentSearchEngines.registerSearchEngine('OldPirateBay', new GenericTorrentSearchEngine({
            mirror: 'https://oldpiratebay.org',
            mirrorResolver: null,
            endpoints: {
                search: '/search?q=%s&sort=-seeders',
                details: '/%s',
            },
            selectors: {
                resultContainer: 'table.search-result tbody tr',
                releasename: ['td:nth-child(2)', 'innerText'],
                magneturl: ['td a[title="MAGNET LINK"]', 'href'],
                size: ['td:nth-child(4)', 'innerText'],
                seeders: ['td:nth-child(5)', 'innerText'],
                leechers: ['td:nth-child(6)', 'innerText'],
                detailUrl: ['td:nth-child(2) a', 'href']
            }
        }, $q, $http, $injector));
    }
])