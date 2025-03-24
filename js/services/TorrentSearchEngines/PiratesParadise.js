DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('PiratesParadise', new GenericTorrentSearchEngine({
        mirror: SettingsService.get('mirror.PiratesParadise'),
        mirrorResolver: null,
        includeBaseURL: true,
        endpoints: {
          search: '/search.php?q=%s&sort=%o'
        },
        selectors: {
          resultContainer: 'table > tbody > tr',
          releasename: ['a.name-link', 'innerText'],
          size: ['td:nth-child(2)', 'innerText'],
          seeders: ['span.seeds', 'innerText'],
          leechers: ['span.peers', 'innerText'],
          magnetUrl: ['button.magnet-btn', 'onclick',
              function(href) {
                  var magnetHash = href.match(/([0-9ABCDEFabcdef]{40})/);
                  return 'magnet:?xt=urn:btih:' + magnetHash[0] + TorrentSearchEngines.trackers;
              }
          ],
          detailUrl: ['a.name-link', 'href']
        },
        orderby: {
          age: {d: 'fetch_date&order=desc', a: 'fetch_date&order=asc'},
          seeders: {d: 'seeds&order=desc', a: 'seeds&order=asc'},
          leechers: {d: 'peers&order=desc', a: 'peers&order=asc'},
          size: {d: 'total_size&order=desc', a: 'total_size&order=asc'}
        }
      }, $q, $http, $injector))
    }
  }
])
