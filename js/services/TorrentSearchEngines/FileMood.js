DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('FileMood', new GenericTorrentSearchEngine({
        mirror: SettingsService.get('mirror.FileMood'),
        mirrorResolver: null,
        includeBaseURL: true,
        endpoints: {
          search: '/result?q=%s in:title'
        },
        selectors: {
          resultContainer: 'table > tbody > tr:has(a.btn-success)',
          releasename: ['a', 'title'],
          size: ['td.dn-size', 'innerText'],
          seeders: ['td.dn-status', 'innerText',
            function(text) {
              var textPart = text.split('/')
              return textPart[0]
            }
          ],
          leechers: [' td.dn-status', 'innerText',
            function(text) {
              var textPart = text.split('/')
              return textPart[1]
            }
          ],
          magnetUrl: ['a', 'href',
              function(href) {
                  var magnetHash = href.match(/([0-9ABCDEFabcdef]{40})/)
                  var fileName = href.replace(magnetHash[0], '').replace('-.html', '').replace('/', '')
                  return 'magnet:?xt=urn:btih:' + magnetHash[0] + '&dn=' + fileName + TorrentSearchEngines.trackers
              }
          ],
          detailUrl: ['a', 'href']
        }
      }, $q, $http, $injector))
    }
  }
])
