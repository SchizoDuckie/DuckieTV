angular.module('DuckieTV.providers.upgradenotification', ['dialogs'])

/** 
 * A little service that checks localStorage for the upgrade.notify key.
 * If it's not null we fetch the upgrade notification message the notifications key
 * and present it in a dialog if it's available.
 *
 * If the user closes the dialog, the notification is dismissed and not shown again.
 */
.factory('UpgradeNotificationService', function($dialogs, $http, $q) {

	var dlgLinks = '<h2>Questions? Suggestions? Bugs? Kudo\'s?</h2>Find DuckieTV on <a href="http://reddit.com/r/DuckieTV" target="_blank">Reddit</a> or <a href="http://facebook.com/DuckieTV/" target="_blank">Facebook</a>.<br>If you find a bug, please report it on <a href="http://github.com/SchizoDuckie/DuckieTV/issues">Github</a></em>';
	var notifications = {
		'0.70': '<ul><li>Sync your shows and watched episodes from and to Trakt.TV<br>(check it out in <a href="#/settings">Settings</a>)<li>The "Most visited sites" drawer can now be changed to open on click<br> (also from <a href="#/settings">Settings</a>)<li>Syncing your favorite shows via your Google account works again.<br>(on by default, disable it in <a href="#/settings">Settings</a>)<li>You can now print the calendar (press CTRL + P or ⌘ + P)</ul>'
	}

	var service = {

		initialize: function() {
			var notifyVersion = localStorage.getItem('upgrade.notify');
			if(notifyVersion != null && (notifyVersion in notifications)) {
				var dlg = $dialogs.notify('DuckieTV was upgraded to '+notifyVersion,
					"<h2>What's new in this version:</h2>"+ notifications[notifyVersion]+dlgLinks);
				 dlg.result.then(function() {
	                localStorage.setItem('upgrade.notify', null);
	            });
			}
		}
	}

	service.initialize();
	return service;
});