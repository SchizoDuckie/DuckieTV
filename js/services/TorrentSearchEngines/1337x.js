DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('1337x', new GenericTorrentSearchEngine({
        mirror: SettingsService.get('mirror.1337x'),
        mirrorResolver: null,
        includeBaseURL: true,
        endpoints: {
          search: '/sort-search/%s/1/'
        },
        selectors: {
          resultContainer: 'tr',
          releasename: ['td.coll-1 a:nth-of-type(2)', 'innerText'],
          seeders: ['td.coll-2', 'innerText'],
          leechers: ['td.coll-3', 'innerText'],
          size: ['td.coll-4', 'innerHTML',
            function(text) {
              var textPart = text.split('<')
              return textPart[0]
            }
          ],
          detailUrl: ['td.coll-1 a:nth-of-type(2)', 'href']
        },
        detailsSelectors: {
          detailsContainer: 'div.no-top-radius',
          magnetUrl: ['ul li a[href^="magnet:?"]', 'href'],
          torrentUrl: ['ul li a[href^="http://itorrents.org/"]', 'href']
        }
      }, $q, $http, $injector))
    }
  }
])
