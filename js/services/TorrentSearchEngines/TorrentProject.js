DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('TorrentProject', new GenericTorrentSearchEngine({
                mirror: ' https://torrentproject.se',
                mirrorResolver: null,
                includeBaseURL: true,
                noMagnet: true,
                endpoints: {
                    search: '/?hl=en&safe=on&num=20&start=0&orderby=%o&s=%s&filter=9000',
                    details: '%s'
                },
                selectors: {
                    resultContainer: 'div.torrent',
                    releasename: ['a', 'innerText'],
                    seeders: ['span[class="bc seeders"] span', 'innerText'],
                    leechers: ['span[class="bc seeders"] span', 'innerText'],
                    size: ['span[class="bc torrent-size"]', 'innerText'],
                    detailUrl: ['a', 'href']
                },
                detailsSelectors: {
                    detailsContainer: '#download',
                    magnetUrl: ['a[href^="magnet:"]', 'href']
                },
                orderby: {
                    age: {d: 'latest', a: 'oldest'},
                    seeders: {d: 'seeders', a: 'seeders'},
                    leechers: {d: 'peers', a: 'peers'},
                    size: {d: 'sizeD', a: 'sizeA'}
                }
            }, $q, $http, $injector));
        }
    }
]);
