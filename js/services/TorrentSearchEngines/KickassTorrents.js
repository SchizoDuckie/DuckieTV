DuckieTV.run(["TorrentSearchEngines", "$q", "$http", "$injector",
    function(TorrentSearchEngines, $q, $http, $injector) {

        TorrentSearchEngines.registerSearchEngine('KickAss', new GenericTorrentSearchEngine({
            mirror: 'https://kat.cr',
            mirrorSettingsKey: 'KickAssTorrents.mirror', // where to grab custom mirror from settings.
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
        }, $q, $http, $injector));

    }
]);