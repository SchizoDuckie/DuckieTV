/**
 * DuckieTV Standalone update check
 * Fetches the latest release from github every 2 days and diffs it with the local version
 */
DuckieTV.run(['$http', 'dialogs', 'SettingsService', function ($http, dialogs, SettingsService) {
  if (!SettingsService.isStandalone()) {
    return
  }

  // check last updated every 2 days.
  var updateDialog = false
  var lastUpdateCheck = localStorage.getItem('github.lastupdatecheck')
  if (!lastUpdateCheck || Number(lastUpdateCheck) + (60 * 60 * 24 * 2 * 1000) < new Date().getTime()) {
    $http.get('https://api.github.com/repos/SchizoDuckie/DuckieTV/releases').then(function (result) {
      result = result.data
      // store current update time.
      localStorage.setItem('github.lastupdatecheck', new Date().getTime())
      if (!Array.isArray(result) || !result.length || !result[0].tag_name || !result[0].html_url) {
        return
      }
      // if release is older than current version, skip.
      var currentVersion = nw.App.manifest.version.split('.').map(Number)
      var releaseVersion = String(result[0].tag_name).replace(/^v/, '').split('.').map(Number)
      var newer = false
      for (var index = 0; index < 3; index++) {
        if ((releaseVersion[index] || 0) === (currentVersion[index] || 0)) continue
        newer = (releaseVersion[index] || 0) > (currentVersion[index] || 0)
        break
      }
      if (!newer) {
        return
      }
      // The upstream release feed does not declare its bundled NW.js version or
      // native-SQLite profile compatibility. Record the informational result,
      // but never direct this profile to a potentially older runtime package.
      localStorage.setItem('github.latestrelease', JSON.stringify({
        tag: result[0].tag_name,
        publishedAt: result[0].published_at,
        url: result[0].html_url,
        runtimeCompatibility: 'unverified'
      }))
      console.info('A newer upstream DuckieTV release exists, but its NW.js storage compatibility is unverified', result[0].tag_name)
      var safeTag = String(result[0].tag_name).replace(/[^0-9A-Za-z._-]/g, '')
      var settingsKey = 'notification.dontshow.' + safeTag
      if (localStorage.getItem(settingsKey)) return
      var dlg = dialogs.confirm('Upstream DuckieTV release', [
        'DuckieTV ', safeTag, ' is listed upstream. Its NW.js 0.116 native-SQLite profile compatibility has not been verified, so this app cannot recommend installing it.',
        '<br><br>Open the release details page for review?',
        '<br><button class="btn btn-danger" onclick="localStorage.setItem(\'', settingsKey, '\', 1);">Do not show this notice again for ', safeTag, '</button>'
      ].join(''))
      dlg.result.then(function() { nw.Shell.openExternal(result[0].html_url) })
    })
  }
}])
