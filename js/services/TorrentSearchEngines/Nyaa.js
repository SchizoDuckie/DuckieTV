DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('Nyaa', new GenericTorrentSearchEngine({
                mirror: 'https://nyaa.si',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/?q=%s&f=0&c=0_0%o'
                },
                selectors: {
                    resultContainer: 'tr',
                    releasename: ['td:nth-of-type(2) a:last-of-type', 'innerText'],
                    magnetUrl: ['td:nth-of-type(3) a[href^="magnet:?"]', 'href'],
                    torrentUrl: ['td:nth-of-type(3) a[href$=".torrent"]', 'href'],
                    size: ['td:nth-of-type(4)', 'innerText'],
                    seeders: ['td:nth-of-type(6)', 'innerText'],
                    leechers: ['td:nth-of-type(7)', 'innerText'],
                    detailUrl: ['td:nth-of-type(2) a:last-of-type', 'href']
                },
                orderby: {
                    leechers: {d: '&s=leechers&o=desc', a: '&s=leechers&o=asc'},
                    seeders: {d: '&s=seeders&o=desc', a: '&s=seeders&o=asc'},
                    size: {d: '&s=size&o=desc', a: '&s=size&o=asc'}
                }
            }, $q, $http, $injector));
        }
    }
]);