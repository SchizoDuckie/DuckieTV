DuckieTV.run(['TorrentSearchEngines', 'SettingsService', '$q', '$http', '$injector',
  function(TorrentSearchEngines, SettingsService, $q, $http, $injector) {
    if (SettingsService.get('torrenting.enabled')) {
      TorrentSearchEngines.registerSearchEngine('TGx', new GenericTorrentSearchEngine({
        mirror: SettingsService.get('mirror.TGx'),
        mirrorResolver: null,
        includeBaseURL: true,
        endpoints: {
          search: '/torrents.php?search=%s&lang=0&sort=%o'
        },
        selectors: {
          resultContainer: 'div[class="tgxtablerow"] ',
          releasename: ['div a[href^="/torrent/"]', 'title'],
          magnetUrl: ['div a[href^="magnet:?"]', 'href'],
          size: ['div span[style^="border-radius"]', 'innerText'],
          seeders: ['div span[title="Seeders/Leechers"] font b', 'innerText'],
          leechers: ['div span[title="Seeders/Leechers"] font:nth-child(2) b', 'innerText'],
          detailUrl: ['div a[href^="/torrent/"]', 'href']
        },
        orderby: {
          seeders: {d: 'seeders&order=desc', a: 'seeders&order=asc'},
          size: {d: 'size&order=desc', a: 'size&order=asc'}
        }
      }, $q, $http, $injector))
    }
  }
])
