DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('theRARBG', new GenericTorrentSearchEngine({
        mirror: SettingsService.get('mirror.theRARBG'),
        mirrorResolver: null,
        includeBaseURL: true,
        endpoints: {
          search: '/get-posts/keywords:%s:order:%o/'
        },
        selectors: {
          resultContainer: 'tr.list-entry',
          releasename: ['a[href^="/post-detail/"]', 'innerText'],
          seeders: ['td:nth-child(7)', 'innerText'],
          leechers: ['td:nth-child(8)', 'innerText'],
          size: ['td.sizeCell', 'innerText'],
          detailUrl: ['a[href^="/post-detail/"]', 'href']
        },
        detailsSelectors: {
          detailsContainer: 'table.detailTable',
          magnetUrl: ['a[href^="magnet:?"]', 'href']
        },
        orderby: {
          age: {d: '-a', a: 'a'},
          seeders: {d: '-se', a: 'se'},
          leechers: {d: '-le', a: 'le'},
          size: {d: '-s', a: 's'}
        }
      }, $q, $http, $injector))
    }
  }
])
