
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
}])
