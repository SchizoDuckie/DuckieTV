DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('EzTV.ag', new GenericTorrentSearchEngine({
        mirror: 'https://eztv.io/',
        mirrorResolver: null,
        includeBaseURL: true,
        endpoints: {
          search: 'search/%s'
        },
        selectors: {
          resultContainer: 'table.forum_header_border tr.forum_header_border',
          releasename: ['td > a.epinfo', 'innerText'],
          size: ['td:nth-child(3)', 'innerText'],
          seeders: ['td:nth-child(5)', 'innerText'],
          leechers: ['td:nth-child(5)', 'innerText', function(a) {
            return 'n/a'
          }],
          detailUrl: ['td.forum_thread_post > a.epinfo', 'href']
        },
        detailsSelectors: {
          detailsContainer: 'td[valign="top"] div div',
          magnetUrl: ['a[href^="magnet:?xt="]', 'href']
        }
      }, $q, $http, $injector))
    }
  }
])
