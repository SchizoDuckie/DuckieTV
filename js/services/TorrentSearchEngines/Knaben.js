DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('Knaben', new GenericTorrentSearchEngine({
        mirror: SettingsService.get('mirror.Knaben'),
        mirrorResolver: null,
        includeBaseURL: false,
        endpoints: {
          search: '/search/%s/0/1/%o'
        },
        selectors: {
          resultContainer: 'tr[data-id]',
          releasename: ['td:nth-child(2) a', 'innerText'],
          magnetUrl: ['td:nth-child(2) a', 'href'],
          size: ['td:nth-child(3)', 'innerText'],
          seeders: ['td:nth-child(5)', 'innerText'],
          leechers: ['td:nth-child(6)', 'innerText'],
          detailUrl: ['td:last-child a', 'href']
        },
        orderby: {
          age: {d: 'date', a: '-date'},
          leechers: {d: 'peers', a: '-peers'},
          seeders: {d: 'seeders', a: '-seeders'},
          size: {d: 'bytes', a: '-bytes'}
        }
      }, $q, $http, $injector))
    }
  }
])
