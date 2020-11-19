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
      '1.1.6': ['<li>Languages: (new) Greek, Turkish, Slovak and South African English.',
        '<li>Languages: (fix) Chinese, Dutch.',
        '<li>SearchEngines: (new) Add ETTV (www.ettvcentral.com), ETag (extratorrent.si), IsoHunt2 (isohunt.tv), TGx (torrentgalaxy.org), EXT (ext.to), KATws (kickass.ws).',
        '<li>SearchEngines: (del) Katcr is broken.',
        '<li>SearchEngines: (fix) EzTVag new domain (eztv.re) and results, limetorrrents DL links, 1337x DL links, TPB (*0.org), TPB mirror resolver, RarBG details links.',
        '<li>Standalone: (upgrade) NWJS 49.1 with Chromium 86',
        '<li>TorrentClient: (new) Introducing tTorrent client.',
        '<li>TorrentClient: (fix) Replace deprecaded rTorrent calls, add support for qBitTorrent 4.2+.',
        '<li>TorrentMonitor: (fix) Auto-Stop-All now works as intended.',
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
