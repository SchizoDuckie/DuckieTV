DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('1337x', new GenericTorrentSearchEngine({
                mirror: 'https://1337x.to',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/sort-search/%s/%o/1/'
                },
                selectors: {
                    resultContainer: 'tr',
                    releasename: ['td.coll-1 a:nth-of-type(2)', 'innerText'],
                    seeders: ['td.coll-2', 'innerText'],
                    leechers: ['td.coll-3', 'innerText'],
                    size: ['td.coll-4', 'innerHTML',
                        function(text) {
                            var textPart = text.split('<');
                            return textPart[0];
                        }
                    ],
                    detailUrl: ['td.coll-1 a:nth-of-type(2)', 'href']
                },
                detailsSelectors: {
                    detailsContainer: 'div[class^="torrent-category-detail"]',
                    magnetUrl: ['li a', 'href',
                        function(href) {
                            var hrefPart = href.split('&tr');
                            return hrefPart[0] + TorrentSearchEngines.trackers;
                        }
                    ],
                    torrentUrl: ['li.dropdown li a', 'href']
                },
                orderby: {
                    seeders: {d: 'seeders/desc', a: 'seeders/asc'},
                    leechers: {d: 'leechers/desc', a: 'leechers/asc'},
                    size: {d: 'size/desc', a: 'size/asc'}
                }
            }, $q, $http, $injector));
        }
    }
]);
