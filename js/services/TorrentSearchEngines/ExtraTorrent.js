DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('ExtraTorrent', new GenericTorrentSearchEngine({
                mirror: 'https://extratorrent.cc',
                mirrorResolver: null,
                includeBaseURL: true,
                noMagnet: true,
                endpoints: {
                    search: '/search/?search=%s&srt=%o',
                    details: '%s'
                },
                selectors: {
                    resultContainer: 'table.tl tr[class]',
                    releasename: ['td.tli > a', 'innerText'],
                    size: ['td:nth-of-type(4)', 'innerText'],
                    seeders: ['td:nth-child(5)', 'innerText'],
                    leechers: ['td:nth-child(6)', 'innerText'],
                    detailUrl: ['td.tli > a', 'href'],
                    torrentUrl: ['td a[title^="Download "]', 'href',
                        function(href) {
                            return href.replace('torrent_','');
                        }
                    ]
                },
                detailsSelectors: {
                    detailsContainer: 'body',
                    magnetUrl: ['a[title="Magnet link"]', 'href']
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
