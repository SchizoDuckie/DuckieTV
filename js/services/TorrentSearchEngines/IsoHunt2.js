DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('IsoHunt2', new GenericTorrentSearchEngine({
        mirror: SettingsService.get('mirror.IsoHunt2'),
        mirrorResolver: null,
        includeBaseURL: true,
        endpoints: {
          search: '/torrent/?ihq=%s&iht=0'
        },
        selectors: {
          resultContainer: 'tr[data-key="0"]',
          releasename: ['td.title-row > a[href^="/torrent_details/"]', 'innerText'],
          size: ['td.size-row', 'innerText'],
          seeders: ['td.sn', 'innerText'],
          leechers: ['td.sn', 'innerText',
            function(text) {
              return 'n/a'
            }
          ],
          detailUrl: ['td.title-row > a[href^="/torrent_details/"]', 'href']
        },
        detailsSelectors: {
          detailsContainer: 'div[class="row mt"]',
          magnetUrl: ['a:nth-of-type(2)', 'href',
            function(shortlink) {
              return decodeURIComponent(shortlink.replace('https://mylink.cloud/?url=', ''))
            }
          ]
        }
      }, $q, $http, $injector))
    }
  }
])
