DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('KATws', new GenericTorrentSearchEngine({
        mirror: SettingsService.get('mirror.KATws'),
        mirrorResolver: null,
        includeBaseURL: true,
        endpoints: {
          search: '/usearch/%s/?%o'
        },
        selectors: {
          resultContainer: 'table.data tr[id]',
          releasename: ['a.cellMainLink', 'innerText'],
          size: ['td:nth-child(2)', 'innerText'],
          seeders: ['td:nth-child(4)', 'innerText',
              function(text) {
                  return (text == 'N/A') ? null : text;
              }
          ],
          leechers: ['td:nth-child(5)', 'innerText',
              function(text) {
                  return (text == 'N/A') ? null : text;
              }
          ],
          magnetUrl: ['td:nth-child(1) > div > a[data-download=""]', 'href',
              function(href) {
                  var decodedURI = decodeURIComponent(href)
                  return decodedURI.substring(href.indexOf('url=') + 4);
              }
          ],
          detailUrl: ['a.cellMainLink ', 'href']
        },
        orderby: {
          age: {d: 'field=time_add&sorder=desc', a: 'field=time_add&sorder=asc'},
          leechers: {d: 'field=leechers&sorder=desc', a: 'field=leechers&sorder=asc'},
          seeders: {d: 'field=seeders&sorder=desc', a: 'field=seeders&sorder=asc'},
          size: {d: 'field=size&sorder=desc', a: 'field=size&sorder=asc'}
        }
      }, $q, $http, $injector))
    }
  }
])
