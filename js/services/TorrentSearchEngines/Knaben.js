DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('Knaben', new GenericTorrentSearchEngine({
        mirror: SettingsService.get('mirror.Knaben'),
        mirrorResolver: null,
        includeBaseURL: false,
        endpoints: {
          search: '/search/?cat=All&q=%s&fast=0&s=%o'
        },
        selectors: {
          resultContainer: 'table#myTable > tbody > tr',
          releasename: ['td:nth-child(2) a', 'innerText'],
          magnetUrl: ['td:nth-child(2) a', 'href'],
          size: ['td:nth-child(3)', 'innerText'],
          seeders: ['td:nth-child(5)', 'innerText'],
          leechers: ['td:nth-child(6)', 'innerText'],
          detailUrl: ['td:last-child a', 'href']
        },
        orderby: {
          age: {d: 'Date', a: 'Date'},
          leechers: {d: 'Peers', a: 'Peers'},
          seeders: {d: 'Seeders', a: 'Seeders'},
          size: {d: 'Size', a: 'Size'}
        }
      }, $q, $http, $injector))
    }
  }
])
