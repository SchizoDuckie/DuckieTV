DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {

            TorrentSearchEngines.registerSearchEngine('ETTV', new GenericTorrentSearchEngine({
                mirror: 'https://www.ettv.tv',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/torrents-search.php?cat=0&search=%s&sort=%o'
                },
                selectors: {
                    resultContainer: 'tr ',
                    releasename: ['td:nth-child(2) > a > b', 'innerText'],
                    size: ['td:nth-child(4)', 'innerText'],
                    seeders: ['td:nth-child(6)', 'innerText'],
                    leechers: ['td:nth-child(7)', 'innerText'],
                    detailUrl: ['td:nth-child(2) > a', 'href']
                },
                detailsSelectors: {
                    detailsContainer: 'div.torrent_data > div.data_group',
                    magnetUrl: ['td a[href^="magnet:?xt="]', 'href']
                },
                orderby: {
                    seeders: {d: 'seeders&order=desc', a: 'seeders&order=asc'},
                    leechers: {d: 'leechers&order=desc', a: 'leechers&order=asc'},
                    size: {d: 'size&order=desc', a: 'size&order=asc'},
                }
            }, $q, $http, $injector));
        }
    }
]);