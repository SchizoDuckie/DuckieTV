/**
 * DuckieTV Standalone update check
 * Fetches the latest release from github every 2 days and diffs it with the local version
 */
DuckieTV.run(['$http', 'dialogs', 'SettingsService',
    function($http, dialogs, SettingsService) {

        if (SettingsService.isStandalone()) {
            // check last updated every 2 days.
            var updateDialog = false;
            var lastUpdateCheck = localStorage.getItem('github.lastupdatecheck');
            if (!lastUpdateCheck || lastUpdateCheck + (60 * 60 * 24 * 2 * 1000) < new Date().getTime()) {
                $http.get('https://api.github.com/repos/SchizoDuckie/DuckieTV/releases').then(function(result) {
                    result = result.data;
                    // store current update time.
                    localStorage.setItem('github.lastupdatecheck', new Date().getTime());
                    // if release is older than current version, skip.
                    if (parseFloat(result[0].tag_name) <= parseFloat(navigator.userAgent.replace('DuckieTV Standalone v', ''))) {
                        return;
                    }
                    // if release was dismissed, skip.
                    var settingsKey = 'notification.dontshow.' + result[0].tag_name;
                    if (!localStorage.getItem(settingsKey)) {
                        return;
                    }
                    var releasenotes = '\n' + result[0].body;
                    var dlg = dialogs.confirm('New DuckieTV release!', [
                        'A new version of DuckieTV is available (v', result[0].tag_name, ', released ', new Date(result[0].published_at).toLocaleDateString(), ')<br>',
                        '<p style="margin: 20px 0px; white-space: pre; overflow-wrap: break-word; background-color: transparent; color:white;">',
                        releasenotes.replace(/\n- /g, '<li>'),
                        '</p>',
                        'Do you wish to download it now?',
                        '<br><label class="btn btn-danger" onclick="localStorage.setItem(\'', settingsKey, '\', 1);"> Don\'t show this notification again for v', result[0].tag_name, '</button>'
                    ].join(''));

                    dlg.result.then(function(btn) {
                        nw.Shell.openExternal(result[0].html_url);
                    });
                });
            }
        }
    }
]);