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
		'0.75': "<li>DuckieTV is much faster now<li>Easily delete shows from series you're watching<li>Database write indicators<li>Improved error handling and credentials validation for Trakt.TV <li>Update mechanism improved to handle TheTVDB reassigning ID's (fixing duplicate/disappearing shows on your calendar after an update)<li>IMDB / Wikipedia links on the show details page<li>Added ability to hide 'Specials' for shows (like Dr. Who) (check it out in <a href='#/settings'>Settings</a>)<li>Bandwidth consumption improvements<li>Shows that have ended will now only be checked for updates every 2 weeks<li>Fixed Torrent Dialog search box to automatically grab keyboard focus<li>Torrent auto-download service now runs every 2 hours instead of every 4 hours<li>Fixed 'Scenename' lookup for downloads"
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