
/**
 * Migrations that run when updating DuckieTV version.
 */
DuckieTV.run(['SettingsService', function(SettingsService) {
  // switch to trakt indexed Scene(Name|Date)Exceptions tables
  if (!localStorage.getItem('1.1.6TraktSceneTables')) {
    console.info('Executing 1.1.6TraktSceneTables')
    localStorage.removeItem('snr.name-exceptions')
    localStorage.removeItem('snr.date-exceptions')
    localStorage.removeItem('snr.lastFetched')
    localStorage.setItem('1.1.6TraktSceneTables', new Date())
    console.info('1.1.6TraktSceneTables done!')
  }
  // switch tpb default domain
  if (!localStorage.getItem('1.1.6TPBorgto0org')) {
    console.info('Executing 1.1.6TPBorgto0org')
    SettingsService.set('ThePirateBay.mirror', 'https://thepiratebay0.org/');
    localStorage.setItem('1.1.6TPBorgto0org', new Date())
    console.info('1.1.6TPBorgto0org done!')
  }
  // delete watchlist
  if (!localStorage.getItem('1.1.6deleteWatchList')) {
    console.info('Executing 1.1.6deleteWatchList')
    CRUD.executeQuery('drop table WatchList')
    CRUD.executeQuery('drop table WatchListObject')
    localStorage.setItem('1.1.6deleteWatchList', new Date())
    console.info('1.1.6deleteWatchList done!')
  }
  // update quality list
  if (!localStorage.getItem('1.1.6updateQualityList2')) {
    console.info('Executing 1.1.6updateQualityList2')
    SettingsService.set('torrenting.searchqualitylist', ['HDTV', 'WEB', '720p', '1080p', '2160p', 'x265']);
    localStorage.setItem('1.1.6updateQualityList2', new Date())
    console.info('1.1.6updateQualityList2 done!')
  }
  // bump qBittorrent 3.2+ to qBittorrent 4.1+
  if (!localStorage.getItem('1.1.6updateqBt32+toqBt41+')) {
    console.info('Executing 1.1.6updateqBt32+toqBt41+')
    if (localStorage.getItem('torrenting.client') == "qBittorrent 3.2+") {
      console.info('found qBittorrent 3.2+, switching to qBittorrent 4.1+')
      localStorage.setItem('torrenting.client', 'qBittorrent 4.1+')
    }
    localStorage.setItem('1.1.6updateqBt32+toqBt41+', new Date())
    console.info('1.1.6updateqBt32+toqBt41+ done!')
  }
  // SE domain updates (for those that have used a backup restore)
  if (!localStorage.getItem('1.1.6SEdomainUpdate')) {
    console.info('Executing 1.1.6SEdomainUpdate')
    SettingsService.set('mirror.1337x', 'https://1337x.to');
    SettingsService.set('mirror.ETag', 'https://extratorrent.st');
    SettingsService.set('mirror.EXT', 'https://ext.to');
    SettingsService.set('mirror.FileMood', 'https://filemood.com');
    SettingsService.set('mirror.Idope', 'https://idope.se');
    SettingsService.set('mirror.IsoHunt2', 'https://isohunt.ch');
    SettingsService.set('mirror.KATws', 'https://kickass.ws');
    SettingsService.set('mirror.Knaben', 'https://knaben.org');
    SettingsService.set('mirror.LimeTorrents', 'https://www.limetorrents.fun');
    SettingsService.set('mirror.Nyaa', 'https://nyaa.si');
    SettingsService.set('mirror.PiratesParadise', 'https://piratesparadise.org');
    SettingsService.set('mirror.ShowRSS', 'https://showrss.info');
    SettingsService.set('mirror.theRARBG', 'https://therarbg.to');
    SettingsService.set('mirror.ThePirateBay', 'https://thepiratebay0.org/');
    SettingsService.set('mirror.TorrentDownloads', 'https://www.torrentdownloads.pro');
    SettingsService.set('mirror.Uindex', 'https://uindex.org');
    localStorage.setItem('1.1.6SEdomainUpdate', new Date())
    console.info('1.1.6SEdomainUpdate done!')
  }
}])
