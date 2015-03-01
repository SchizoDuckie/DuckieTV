/** 
 * A little service that checks localStorage for the upgrade.notify key.
 * If it's not null we fetch the upgrade notification message the notifications key
 * and present it in a dialog if it's available.
 *
 * If the user closes the dialog, the notification is dismissed and not shown again.
 */
DuckieTV.factory('UpgradeNotificationService', ["$dialogs", "$http", "$q",
    function($dialogs, $http, $q) {

        var dlgLinks = '<h2>Questions? Suggestions? Bugs? Kudo\'s?</h2>Find DuckieTV on <a href="http://reddit.com/r/DuckieTV" target="_blank">Reddit</a> or <a href="http://facebook.com/DuckieTV/" target="_blank">Facebook</a>.<br>If you find a bug, please report it on <a href="http://github.com/SchizoDuckie/DuckieTV/issues">Github</a></em>';
        var notifications = {
            '0.94': ["<li>Switched to the new (hopefully more stable) trakt.tv endpoint",
                "<li>Added actor and rating info back to serie details",
                "<li>Fixed KAT Mirror Resolver and custom setting and added back TPB mirror selection to torrent settings",
                "<li>Changed default KAT mirror back to kickass.to",
                "<li>Minor tweaks to auto-download and updatecheck mechanisms",
                "<li>Built a little standalone website to turn off uTorrent's ads with one click.<br><center><a href='http://schizoduckie.github.io/PimpMyuTorrent/?fd' target='_blank'><strong>Click here to turn off your uTorrent ads</a></center>"
            ].join('')
        }

        var service = {

            initialize: function() {
                $http({
                    method: 'GET',
                    url: 'VERSION'
                }).
                success(function(data, status, headers, config) {
                    var notifyVersion = data.trim();
                    if (notifyVersion != null && (notifyVersion in notifications) && localStorage.getItem('upgrade.notify') != notifyVersion) {
                        var dlg = $dialogs.notify('DuckieTV was upgraded to ' + notifyVersion,
                            "<h2>What's new in this version:</h2>" + notifications[notifyVersion] + dlgLinks, {}, {
                                size: 'lg'
                            });
                        dlg.result.then(function() {
                            localStorage.setItem('upgrade.notify', notifyVersion);
                        });
                    }
                });
            }
        }

        service.initialize();
        return service;
    }
]);