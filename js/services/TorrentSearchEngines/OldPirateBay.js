DuckieTV.run(["TorrentDialog",
    function(TorrentDialog) {
        TorrentDialog.registerSearchEngine('OldPirateBay', {
            mirror: 'https://oldpiratebay.org',
            mirrorResolver: null,
            endpoints: {
                search: '/search.php?q=%s&Torrent_sort=seeders.desc',
                details: '/%s',
            },
            selectors: {
                resultContainer: 'table.table-torrents tbody tr',
                releasename: ['td.title-row a span', 'innerText'],
                magneturl: ['td.title-row a[title="MAGNET LINK"]', 'href'],
                size: ['td.size-row', 'innerText'],
                seeders: ['td.seeders-row', 'innerText'],
                leechers: ['td.leechers-row', 'innerText'],
                detailUrl: ['td.title-row > a', 'href']
            }
        });
    }
])