DuckieTV.run(["TorrentSearchEngines", "SettingsService", "$q", "$http", "$injector",
    function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('LimeTorrents', new GenericTorrentSearchEngine({
                mirror: 'https://www.limetorrents.cc',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/search/all/%s/%o'
                },
                selectors: {
                    resultContainer: 'tr[bgcolor^="#F"]',
                    releasename: ['td div a:nth-child(2)', 'innerText'],
                    seeders: ['td:nth-child(4)', 'innerText'],
                    leechers:  ['td:nth-child(5)', 'innerText'],
                    size: ['td:nth-child(3)', 'innerText'],
                    detailUrl: ['td div a:nth-child(2)','href'],
                },
                detailsSelectors: {
                    detailsContainer: 'div.torrentinfo',
                    magnetUrl: ['a[title$="magnet"]', 'href',
                        function(href) {
                            var magnetHash = href.match(/([0-9ABCDEFabcdef]{40})/);
                            return  'magnet:?xt=urn:btih:' + magnetHash[0] + TorrentSearchEngines.trackers;
                        }
                    ],
                    torrentUrl: ['a[title$="torrent"]', 'href']
                },
                orderby: {
                    seeders: {d: 'seeds/1/', a: 'seeds/1/'},
                    size: {d: 'size/1/', a: 'size/1/'}
                }
            }, $q, $http, $injector));
        }
    }
]);