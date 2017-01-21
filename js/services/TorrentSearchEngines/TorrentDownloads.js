DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('TorrentDownloads', new GenericTorrentSearchEngine({
                mirror: 'https://www.torrentdownloads.me',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/search/?search=%s'
                },
                selectors: {
                    resultContainer: 'div[class^="grey_bar3"]',
                    releasename: ['p a[href^="/torrent/"]', 'innerText'],
                    seeders: ['span:nth-of-type(3)', 'innerText'],
                    leechers: ['span:nth-of-type(2)', 'innerText'],
                    size: ['span:nth-of-type(4)', 'innerText'],
                    detailUrl: ['p a[href^="/torrent/"]', 'href']
                },
                detailsSelectors: {
                    detailsContainer: 'div[class="inner_container"]',
                    magnetUrl: ['a[href^="magnet:"]', 'href'],
                    torrentUrl: ['a[href^="http://itorrents.org/torrent/"]', 'href']
                }
            }, $q, $http, $injector));
        }
    }
]);
