DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('EXT', new GenericTorrentSearchEngine({
        mirror: SettingsService.get('mirror.EXT'),
        mirrorResolver: null,
        includeBaseURL: true,
        endpoints: {
          search: '/search?%o&q=%s'
        },
        selectors: {
          resultContainer: 'table.table-striped > tbody > tr',
          releasename: ['td:nth-child(1) div a', 'innerText'],
          size: ['td:nth-child(2)', 'innerText'],
          seeders: ['td:nth-child(5)', 'innerText'],
          leechers: ['td:nth-child(6)', 'innerText'],
          detailUrl: ['td:nth-child(1) div a', 'href']
        },
        detailsSelectors: {
          detailsContainer: 'div.pt-2',
          magnetUrl: ['a[href^="magnet:?xt="]', 'href']
        },
        orderby: {
          leechers: {d: 'order=leech&sort=desc', a: 'order=leech&sort=asc'},
          seeders: {d: 'order=seed&sort=desc', a: 'order=seed&sort=asc'},
          size: {d: 'order=size&sort=desc', a: 'order=size&sort=asc'}
        }
      }, $q, $http, $injector))
    }
  }
])
