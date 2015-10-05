DuckieTV
/** 
 * A little service that checks localStorage for the upgrade.notify key.
 * If it's not null we fetch the upgrade notification message the notifications key
 * and present it in a dialog if it's available.
 *
 * If the user closes the dialog, the notification is dismissed and not shown again.
 */
.run(["dialogs", "$http", "$q",
    function(dialogs, $http, $q) {

        var dlgLinks = '<h2>Questions? Suggestions? Bugs? Kudo\'s?</h2>Find DuckieTV on <a href="http://reddit.com/r/DuckieTV" target="_blank">Reddit</a> or <a href="http://facebook.com/DuckieTV/" target="_blank">Facebook</a>.<br>If you find a bug, please report it on <a href="http://github.com/SchizoDuckie/DuckieTV/issues">Github</a></em>';
        var notifications = {
            '1.1.3': ["<li>Romanian translations by honeybunny from Addic7ed",
                "<li>French translations by Tra-Vis",
                "<li>Bug fixes for Torrent Client Integrations",
                "<li>Improve Auto-download torrent search matching",
                "<li>Fixed adding shows with numeric titles",
                "<li>optionally display season and episode on calendar",
                "<li>integrated XEM",
                "<li>added marking all of a days shows as downloaded",
                "<li>Season navigation",
                "<li>settings/display options for standalone minimize to Taskbar or Systray",
                "<li>misc bug fixes"
            ].join('')
        };

        $http({
            method: 'GET',
            url: 'VERSION'
        }).
        success(function(data, status, headers, config) {
            var notifyVersion = data.trim();
            if (notifyVersion != null && (notifyVersion in notifications) && localStorage.getItem('upgrade.notify') != notifyVersion) {
                var dlg = dialogs.notify('DuckieTV was upgraded to ' + notifyVersion,
                    "<h2>What's new in this version:</h2>" + notifications[notifyVersion] + dlgLinks, {}, {
                        size: 'lg'
                    });
                dlg.result.then(function() {
                    localStorage.setItem('upgrade.notify', notifyVersion);
                });
            }
        });
    }
]);