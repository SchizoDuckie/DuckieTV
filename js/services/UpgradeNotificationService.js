/**
 * A little service that checks localStorage for the upgrade.notify key.
 * If it's not null we fetch the upgrade notification message the notifications key
 * and present it in a dialog if it's available.
 *
 * If the user closes the dialog, the notification is dismissed and not shown again.
 */
DuckieTV.run(['dialogs', '$http',
  function(dialogs, $http) {
    var dlgLinks = '<h2>Questions? Suggestions? Bugs? Kudo\'s?</h2>Find DuckieTV on <a href="https://reddit.com/r/DuckieTV" target="_blank">Reddit</a> or <a href="https://facebook.com/DuckieTV/" target="_blank">Facebook</a>.<br>If you find a bug, please report it on <a href="https://github.com/SchizoDuckie/DuckieTV/issues">Github</a></em>'
    var notifications = {
      '1.1.6': [
        '<li>AutoDownload: (new) Now able to use series custom Seeders, custom Includes and custom Excludes.',
        '<li>DataBase: (fix) Make TRAKT_ID unique to prevent duplicate records.',
        '<li>TMDBfanArt: (new) Refactor image loading to use TMDB. This complements and progressively takes over from FanArt.',
        '<li>Languages: (new) Greek, Turkish, Slovak and South African English. Languages: (fix) Chinese, Dutch.',
        '<li>Log_GR: (del) Drop Error-Tracking-Loggr, the service is no longer available.',
        '<li>SceneNameResolver: (new) add custom support to subtract/add days from date formated serie names eg YYYY MM DD[-1].',
        '<li>SearchEngines: (new) Add ETag (extratorrent.st), IsoHunt2 (isohunt.tv), TGx (torrentgalaxy.to), EXT (ext.to), KATws (kickass.ws), Knaben (knaben.eu), TheRARBG (t-rb.org).',
        '<li>SearchEngines: (del) Katcr is broken, TorrentZ2 is gone, ETTV is gone, Zooqle is gone, RarBG is gone, EzTV no results without cookie.',
        '<li>SearchEngines: (fix) limetorrrents DL links and new domain, 1337x DL links, TPB (*0.org), TPB mirror resolver proxybay.unblockit.dad, torrentdownloads new domain, fix details link for Jackett indexers.',
        '<li>Standalone: NWJS 0.81.1 with Chromium 118.',
        '<li>Standalone: (fix) Prevent Chromium 112+ freezing tabs if idle. Switch chromium-args: --flag-switches-begin --disable-features=HighEfficiencyModeAvailable --flag-switches-end.',
        '<li>TorrentClient: (new) Introducing tTorrent client.',
        '<li>TorrentClient: (fix) Replace deprecaded rTorrent calls, add support for qBitTorrent 4.2+, ignore aria2 metadata file reports.',
        '<li>TorrentClient: (fix) qBitTorrent 4.5+ fix API call to remove torrent.',
        '<li>TorrentClient: (fix) Upgrade Tixati API for 2.86+. Note that older versions are no longer supported.',
        '<li>TorrentDialogs: (fix) magnetLinks were being submitted twice due to NWJS bug.',
        '<li>TorrentDialogs: (add) Add WEB to the quality list of the torrent search dialogues.',
        '<li>TorrentDialogs: (fix) Trap SE errors so dialogues can report.',
        '<li>TorrentDialog2: (add) individual SE spinners during searching.',
        '<li>TorrentMonitor: (fix) Auto-Stop-All now works as intended.',
        '<li>Trakt: (new) Preserve watched timestamp from Trakt.TV during import.',
        '<li>TraktTrending: (new) Add option to view by Ended, Returning or Cancelled.',
        '<li>TraktTrending: (new) Now updated Daily instead of Weekly.',
        '<li>TraktUpdateServices: (fix) Support added for new API restrictions.',
        '<li>Misc: Bug fixes.'
      ].join('')
    }

    $http.get('VERSION').then(function(data, status, headers, config) {
      var notifyVersion = data.data
      if (notifyVersion != null && (notifyVersion in notifications) && localStorage.getItem('upgrade.notify') != notifyVersion) {
        var dlg = dialogs.notify('DuckieTV was upgraded to ' + notifyVersion,
          "<h2>What's new in this version:</h2>" + notifications[notifyVersion] + dlgLinks, {}, {
            size: 'lg'
          })
        dlg.result.then(function() {
          localStorage.setItem('upgrade.notify', notifyVersion)
        })
      }
    })
  }
])
