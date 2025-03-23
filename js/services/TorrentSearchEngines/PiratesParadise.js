DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('PiratesParadise', new GenericTorrentSearchEngine({
        mirror: SettingsService.get('mirror.PiratesParadise'),
        mirrorResolver: null,
        includeBaseURL: true,
        endpoints: {
          search: '/search.php?q=%s'
        },
        selectors: {
          resultContainer: 'table > tbody > tr',
          releasename: ['a.name-link', 'innerText'],
          size: ['td:nth-child(2)', 'innerText'],
          seeders: ['td:nth-child(3)', 'innerText'],
          leechers: ['td:nth-child(4)', 'innerText'],
          magnetUrl: ['button.magnet-btn', 'onclick',
              function(href) {
                  var magnetHash = href.match(/([0-9ABCDEFabcdef]{40})/);
                  return 'magnet:?xt=urn:btih:' + magnetHash[0] + TorrentSearchEngines.trackers;
              }
          ],
          detailUrl: ['a.name-link', 'href']
        }
      }, $q, $http, $injector))
    }
  }
])
