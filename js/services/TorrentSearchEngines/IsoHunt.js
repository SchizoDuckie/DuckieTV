DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('IsoHunt', new GenericTorrentSearchEngine({
                mirror: ' https://isohunt.to',
                mirrorResolver: null, 
                includeBaseURL: true,
                endpoints: {
                    search: '/torrents/?ihq=%s&Torrent_sort=-seeders',
                    details: '%s'
                },
                selectors: {
                    resultContainer: 'div[id="serps"] table tbody tr',
                    releasename: ['td:nth-child(2) a span', 'innerText'],
                    magneturl: ['a[title="BitLord streaming"]', 'data-href',
                        function(a) {
                            return a.replace('torrentstream','magnet') + '&tr=udp://tracker.coppersurfer.tk:6969/announce&tr=udp://tracker.openbittorrent.com:80/announce&tr=udp://11.rarbg.me:80/announce&tr=udp://9.rarbg.me:2710/announce&tr=udp://9.rarbg.com:2710/announce';
                        }
                    ],
                    size: ['td:nth-child(6)', 'innerText'],
                    seeders: ['td:nth-child(7)', 'innerHTML'],
                    leechers: 'n/a',
                    detailUrl: ['td:nth-child(2) a', 'href']
                }
            }, $q, $http, $injector));
        }

    }
]);