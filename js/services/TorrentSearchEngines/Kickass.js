DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('KickAss', new GenericTorrentSearchEngine({
                mirror: 'https://kat.cr',
                mirrorSettingsKey: 'KickAssTorrents.mirror', // where to grab custom mirror from settings.
                mirrorResolver: null, //'KickassMirrorResolver'
                includeBaseURL: true,
                endpoints: {
                    search: '/usearch/%s/?field=%o&sorder=desc',
                    details: '/torrent/%s'
                },
                selectors: {
                    resultContainer: 'table.data tr[id^=torrent_]',
                    releasename: ['div.torrentname a.cellMainLink', 'innerText'],
                    magneturl: ['a[title="Torrent magnet link"]', 'href'],
                    size: ['td:nth-child(2)', 'innerText'],
                    seeders: ['td:nth-child(5)', 'innerHTML'],
                    leechers: ['td:nth-child(6)', 'innerHTML'],
                    detailUrl: ['div.torrentname a.cellMainLink', 'href']
                },
                orderby: {
                    age: 'time_add',
                    leechers: 'leechers',
                    seeders: 'seeders', 
                    size: 'size'
                }
            }, $q, $http, $injector));
        }

    }
]);