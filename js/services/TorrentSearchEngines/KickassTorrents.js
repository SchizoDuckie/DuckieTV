DuckieTV.run(["TorrentDialog",
    function(TorrentDialog) {
        TorrentDialog.registerSearchEngine('KickAssTorrents', {
            mirror: 'https://kickass.to',
            mirrorResolver: null, //'KickassMirrorResolver'
            endpoints: {
                search: '/usearch/%s/?field=seeders&sorder=desc',
                details: '/torrent/%s'
            },
            selectors: {
                resultContainer: 'table.data tr[id^=torrent]',
                releasename: ['div.torrentname a.cellMainLink', 'innerText'],
                magneturl: ['a[title="Torrent magnet link"]', 'href'],
                size: ['td:nth-child(2)', 'innerText'],
                seeders: ['td:nth-child(5)', 'innerHTML'],
                leechers: ['td:nth-child(6)', 'innerHTML'],
                detailUrl: ['div.torrentname a.cellMainLink', 'href']
            }
        });

    }
]);