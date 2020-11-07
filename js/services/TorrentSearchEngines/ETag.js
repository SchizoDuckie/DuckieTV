DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('ETag', new GenericTorrentSearchEngine({
        mirror: SettingsService.get('mirror.ETag'),
        mirrorResolver: null,
        includeBaseURL: true,
        endpoints: {
          search: '/search/?search=%s&srt=%o'
        },
        selectors: {
          resultContainer: 'tr[class^="tl"]',
          releasename: ['a[href*="/torrent/"][title^="view"]', 'innerText'],
          magnetUrl: ['a[href^="magnet:?xt="]', 'href'],
          seeders: ['td.sy, td.sn', 'innerText',
            function(text) {
              return (text == null) ? 0 : text
            }
          ],
          leechers: ['td.ly, td.ln', 'innerText',
            function(text) {
              return (text == null) ? 0 : text
            }
          ],
          size: ['td:nth-last-of-type(4)', 'innerText'],
          detailUrl: ['a[href*="/torrent/"]', 'href']
        },
        orderby: {
          seeders: {d: 'seeds&order=desc', a: 'seeds&order=desc'},
          leechers: {d: 'leechers&order=desc', a: 'leechers&order=desc'},
          size: {d: 'size&order=desc', a: 'size&order=desc'}
        }
      }, $q, $http, $injector))
    }
  }
])
