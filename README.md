DuckieTV Binary, Chrome and Online [![Build Status](https://travis-ci.org/SchizoDuckie/DuckieTV.svg?branch=angular)](https://travis-ci.org/SchizoDuckie/DuckieTV)
==============================================

DuckieTV is an application that takes care of TV-Show addicts by providing a personalized TV-Show calendar. DuckieTV ensures the information is always up to date and provides an integrated blocking resistant torrent search so that the download can be as easy as possible.


With the integrated DuckieTorrent client, users can connect DuckieTV to local Torrent client and be updated on the download progress without switching applications. Support is available for clients of &micro;Torrent/BitTorrent, Aria2, BiglyBT, Deluge, Ktorrent, qBittorrent, rTorrent, Tixati, Transmission, tTorrent and Vuze.


As of v0.60, DuckieTV is finally becoming a worthy SickBeard competitor by introducing an automatic downloading of shows that have aired and translations into 17 languages (English, Deutch, Ελληνικά, Español, Français, Italiano, 日本, 한국어, Nederlands, Norsk bokmål, Português, Русский, Română, Slovenščina, Svenska, Türkçe, 简体中文).

How can I get it?
=================

DuckieTV can be installed as either a standalone application on Windows (7, 8.1, 10), Linux (Debian based such as Ubuntu 15.10 and newer), Mac OSX (10.10 and newer) and Android (Marshmallow, Nougat and newer), or installed as a Google Chrome Browser Extension, and you can try the basic features in an online version.

Install DuckieTV Standalone
-------------------------------------------
As of v0.81, DuckieTV is available as a standalone build.
Get the latest release here:

https://github.com/SchizoDuckie/DuckieTV/releases/latest

Install DuckieTV For Chrome
---------------------------
DuckieTV for Chrome comes in 2 versions: One that installs itself as your browser's "new tab" page, and one that just provides an easily accessible button to open DuckieTV. 

* [DuckieTV 'New Tab mode': Installs itself as your new tab page](https://chrome.google.com/webstore/detail/hkbamkappmgfjjahmnlngibomenmbbdf/)
* [DuckieTV 'Browser Action mode': Adds a button next to your address bar](https://chrome.google.com/webstore/detail/cdfkaloficjmdjbgmckaddgfcghgidei/)

Try DuckieTV online
-------------------
* You can now also try DuckieTV online, provided you have a Chrome, Safari, Opera or an Android browser. Note that this demonstration model is using a third party service to work around cross-domain limitations and can be broken at any time. It is not suitable for daily use.
  Try it [here](http://DuckieTV.github.io/DuckieTV/)

Screenshots:
============
**Your main screen is a beautiful calendar with backgrounds tailored to the shows you are watching**
![Standalone](http://i.imgur.com/qi6yqA3.png)

**Add your favorite shows by selecting them off TraktTV's Trending Shows list, or search manually**
![Add new shows with ease, pick from Trak.TV's trending shows](http://i.imgur.com/ihdiKi8.png)

**Navigate to any of your shows easily by opening your "favorites" panel**
!['favorites'](http://i.imgur.com/ZVu1yXh.png)

**View series, season and episode details about your shows**
![View details](http://i.imgur.com/MyzKgXp.png)

**Track and mark which shows you have downloaded, and which ones you have watched.**
![Mark episodes as downloaded and watched](http://i.imgur.com/rM9fO3c.png)

**Control various settings to adjust DuckieTV to your needs, translated into your choice of 17 languages**
![Settings](http://i.imgur.com/wuooBSS.png)

**You can either completely turn off Torrent integration or tune it to your preference**
![Torrent Settings](http://i.imgur.com/uQRjBWp.png)

**Instant access to Torrent Client features from the calendar**
![Stream with uTorrent player](http://i.imgur.com/cGuQ6LU.png)

**DuckieTorrent Torrent clients built-in (&micro;Torrent/BitTorrent, Aria2, BiglyBT, Deluge, Ktorrent, qBittorrent, rTorrent, Tixati, Transmission, tTorrent, Vuze)**
![DuckieTorrent Torrent integration](http://i.imgur.com/6bXbxHk.png)

**Instant access to QuickSearch, just start typing**
![Quicksearch](http://i.imgur.com/8fU3Kc4.png)

**Keep an eye on the Auto-Download Service with the Monitor**
![AutoDownload Monitor](http://i.imgur.com/7Ultu5W.png)


Changelog: 
==========
* v1.1.6 : ◆ **SearchEngines**: *(new)* Add ETTV (ettv.tv), ETag (extratorrent.ag), IsoHunt2 (isohunt2.net) ◆ **Standalone**: *(upgrade)* NWJS 30.2 with Chromium 66 and Node 10.0.0 ◆ **Languages**: *(new)* Greek and Turkish. ◆ **TorrentClient**: *(new)* Introducing tTorrent client. ◆ **Misc**: *Bug fixes*.
* v1.1.5 : ◆ **AutoDownload**: *(new)* Now able to download .torrent files \o/. ◆ **Database**: *(fix)* Moved the database management services to the *Background* task, to minimise interruptions to DB updates and maintain integrity. ◆ **Favourites**: *(new)* Remembers last used sort selection. ◆ **Favourites**: *(new)* Introducing Anime support. Now a search can use the absolute episode number when available. • Series Settings allows the user to select any available Alias to replace the default Title in searches. ◆ **SearchEngines**: *(new)* Introducing Jackett! You can use the Jackett proxy to access your favourite open/semi-private/private trackers as DuckieTV Search Engines. ◆ **SearchEngines**: *(removed)* IsoHunt.to is gone. ◆ **Standalone**: *(upgrade)* NWJS 25.0 with Chromium 61 and Node 8.4.0 ◆ **TorrentClient**: *(new)* Introducing Aria2 client. ◆ **TorrentClient**: *(new)* Introducing BiglyBT client. ◆ **TorrentClient**: *(fix)* Can now connect with qBitTorrent 3.3.14 (and newer) with CSRF protection. ◆ **TorrentClient**: *(fix)* Can now connect with Deluge 1.3.14 (and newer) with CSRF protection. ◆ **Torrent Dialog [multi-SE]**: *(new)* Remembers last used sort selection. ◆ **Trakt-Sync**: *(upgrade)* When an episode is marked as downloaded it is added to the collected list of a user's Trakt account. ◆ **Trakt-Trending sidepanel**: *(upgrade)* Now using buttons instead of mouse-hover to improve browsing experience. ◆ **Misc**: *Bug fixes*.
* v1.1.4 : ◆ Performance: Massive database write performance improvement. ◆ User Interface: Split up favorites and adding mode, introduced 'todo' mode. You can now add multiple shows at once. • (new) Yellow stars now indicate show or season premieres ◆ Images: (fix) switched to Fanart.tv for all images after Trakt.tv ended support ◆ AutoDownload: (new) using global Require/Ignore Keywords • (new) series custom-search-provider option • (new) option to ignore global Quality, Require and Ignore keywords via series custom settings • (new) use series custom search string • (new) use global/custom size min/max • (fix) episodes with date scene names bug • (new) monitor autoDownload activity via status sidepanel • (new) make AD wait until episode has aired before searching • (new) series custom AD additional delay before searching ◆ FastSearch: (new) introducing the fast-search feature. Just start typing and a dialog pops up with the first six matches of your series from favourites, series from Trakt.TV, and the first 9 matches of episodes from favourites and torrent search. ◆ Standalone: (upgrade) nwjs 20.x chromium 56.x Node 7.5.x (fix) linux minimize bug • (new) option to open add-new-torrent panel on torrentHost • (fix) linux and mac multi-systray bug • (fix) defaults for first-time users bug • (new) option to set the color of the system tray icon ◆ TorrentClients: (new) rTorrent and Ktorrent clients • (new) add remove-torrent functionality to all client Interfaces • (fix) Deluge auto-stop and downloaded bugs • (fix) qBittorrent auto-stop bug • (fix) renamed qBittorrent client to qBittorrent (pre 3.2) for clarity • (new) add series custom download path option for torrentClients that support it ◆ SearchEngines: (fix) remove Strike, KAT and Torrentz as they are gone • (new) add 1337x, Idope, IsoHunt, KATcr, LimeTorrents, SkyTorrents, TorrentDownloads, TorrentZ2 and Zooqle • (fix) drop find-random-KAT-mirror feature as rockaproxy is gone • (fix) bug in RarBG causing non-found results after 15 minutes • (new) add 2160p search quality ◆ Favorites: (new) sort menu for name, added, first-aired and not-watched-count • (new) series poster context-menu for mark-all-watched, show/hide from calendar, and remove-series ◆ Series Sidepanel: (new) option to make the episodes-button jump to the first not-watched season • (fix) mark-all-watched did not sync to Trakt.TV • (new) confirm mark-all-watched dialog ◆ Season Sidepanel: (fix) jump to active season ignores specials unless there is no other seasons • (fix) mark-all-watched did not sync to Trakt.TV • (new) confirm mark-all-watched dialog ◆ Episode Sidepanel: (fix) overview text not height limited bug ◆ Calendar: (fix) events multi-episodes badge incorrectly counted hidden specials bug • (new) Series option to ignore global Hide Specials from calendar • (new) events single click to mark episode as watched • (new) Highlight season premiers with gold star ◆ Top10: (fix) invalid-data handling bug ◆ Subtitles: (fix) net::err_empty_response handling bug ◆ Translations: Russian by galeksandrp, updated italian translations by lamaresh, updated Dutch translations ◆ TraktTV: (new) Option to change the frequency of the Episode updates. ◆ TorrentDialog: (new) Option to sort the Seeders, Leechers and Size column • (new) Option to search using all the Search Engines at once • (add) Option to enable Sort menu to sort by Age. ◆ Backup: (new) A Backup can now be automatically scheduled. Choose between Never,Daily,Weekly or the default Monthly. ◆ Misc bug fixes.
* v1.1.3 : • Translations: Romanian by honeybunny from Addic7ed, French by Tra-Vis, Norwegian by hexjelly, Spanish by iachopolo • Bug fixes for Torrent Client Integrations • Improve Autodownload torrent search matching • Fixed adding shows with numeric titles • optionally display season and episode on calendar • integrated XEM • added marking all of a days shows as downloaded • Season navigation • settings/display options for standalone minimize to Taskbar or Systray • misc bug fixes.
* v1.1.2 : • Fixed v1.1.0 and 1.1.1 build that missed important dependencies. sorry for that. :( • Translations: Italian (lamaresh), German (stormfighter), Portuguese (matigonkas) • Create a settings flag to run auto-stop for torrents not initiated by DuckieTV • Added Vuze, uTorrent WEBUI, and fixed qBittorrent 3.2.0 support. • Made it possible for all torrent clients to upload and launch torrent files to a remote machine. • use mouse-wheel on calendar header to scroll months • Created a settings flag to ignore and hide all ratings (to speed up the daily updates) • Fixes for trakt.tv episode info that's missing important data • Distinguish series that have all episodes marked as watched • Number of unwatched episodes badge over library posters • A start on private tracker integration and allowing users to define custom torrent search engines. • Gui improvements, logos, touch-ups, moved menu items to the bottom stuff. • hopefully finally fixed time-zone time-travel bugs with air dates • Subtitle settings (configure your languages) • Fixed auto-connect logic when opening torrent client and handling re-authentication. • Show next/previous episode when available on series info page • Introduced new transitions for the series-list that should help keeping track of your position when panels resize • standalone option to minimize window to system-tray at start-up  • Enable/Disable auto-download for selected series. • You can now mark the entire series as watched. • Added Genre and Status filters to the library page.
* v1.0.1 : Fixed a missing dependency that broke the qBittorrent and Transmission integration
* v1.0 : Completely revamped user interface (now with 100% more sexyness) - Added support for Tixati, Transmission and qBittorrent torrent clients - Added Strike and RarBG torrent search providers - Added calendar grouping for netflix episode dumps - Initial version of Subtitle search available from episodes panel - Removed Chromecast integration. (Use getvideostream.com and the app!) - Autodownloads now use the configured torrent provider - Revamped the way torrent search engines are created and registered - Shows can be marked as downloaded as well as watched, and downloaded episodes can be highlighted on the calendar - Added Trakt.TV Trending category filters, caching for Trakt.TV trending list - Fixes for DuckieTV standalone: now using frame-less window, open external links in default browser, window and unminimize from tray works in Ubuntu, added upgrade check and notification, and zoom control is now 1:1 with chrome browser - Database performance improvement (including less frequent ratings updates) - added 'Watch on Netflix' button for Netflix shows - numerous other small changes and bugfixes to list 
* v0.94 : Switched to the new (hopefully more stable) trakt.tv endpoint, Added actor and rating info back to serie details, Fixed KAT Mirror Resolver and custom setting and added back TPB mirror selection to torrent settings, Changed default KAT mirror back to kickass.to, Minor tweaks to auto-download and updatecheck mechanisms, Built a little standalone website to turn off uTorrent's ads with one click. ( http://schizoduckie.github.io/PimpMyuTorrent/)
* v0.93 : Welcome back TPB! Added ShowRSS.info as a custom datasource
* v0.92 : Fixed problem with deployment script: moment.js was not included, breaking torrent searches for shows that are released with a date format.
* v0.91 : Fixed some people's problems with the upgrade and now-missing watched indicators (They'll restore automatically).Removed Torrents.fm (domain cancelled), Fixed OldPirateBay on https. Fixed Timezone offset for torrent search with dates, added some requested scene names and updated some translations in Italian, Dutch and English.
* v0.90 : Fixed TraktTV v2 API, compensated for TPB being down, many performance improvements, updated dutch and italian translations
* v0.82 : Fixed chrome v39 compatibility, sync engine still a work in progress.
* v0.81 : Some changes to the add to favorites screen, now showing detailed show information on hover. Also, some changes to make DuckieTV work in standalone mode, no chrome required! Get it at https://github.com/SchizoDuckie/DuckieTV/releases/
* v0.80 : A minor update with big impact: Daylight Savings Time fix by /u/garfield69
* v0.79 : Fixed infinite digest in calendar preventing usage on huge databases. Updated torrent autoDownloader to handle the same logic as the torrentDialog
* v0.78 : Fixed 'yes-all' and 'no-all' dialogs..
* v0.77 : Added 'yes-all' and 'no-all' buttons for confirming remote deletions in storage sync, preventing users to potentially have to confirm loads of deletions. Fixed StorageSyncService only syncing one show at a time.
* v0.76 : Fixed calendar not updating because of Hidden Series & DuckieTV now warns you while closing or navigating away from the app while shows are being added
* v0.75 : DuckieTV is much faster now, Easily delete shows from series you're watching, Database write indicators, Improved error handling and credentials validation for Trakt.TV, Update mechanism improved to handle TheTVDB reassigning ID's (fixing duplicate/disappearing shows on your calendar after an update), IMDB / Wikipedia links on the show details page, Added ability to hide 'Specials' for shows (like Dr. Who), Bandwidth consumption improvements, Shows that have ended will now only be checked for updates every 2 weeks, Fixed Torrent Dialog search box to automatically grab keyboard focus, Torrent auto-download service now runs every 2 hours instead of every 4 hours, Fixed 'Scenename' lookup for downloads.
* v0.70 : One of the most requested features was added: You can now sync your shows and watched episodes from and to Trakt.TV! The "Most visited sites" drawer can now be changed to open on click, syncing your favorite shows via your Google account works again. and you can now print the calendar.
* v0.62 : Fixed a problem with the add series typeahead
* v0.61 : Fixed deployment problem for english/uk users.
* v0.60 : New tabs interface in settings thanks to /u/Js41637, Introduced Internationalisation and translations thanks to /u/Garfield69, Initial translations into English and Dutch, the 9 other most popular languages are included in auto-translated form. Optimized watched indicator in calendar, added Trakt.TV's trending shows to 'series you're watching', made it possible to use the basic features of DuckieTV as a regular website: http://DuckieTV.github.io/DuckieTV/ (browsers that support WebSQL only! Tested on Chrome/Opera/Android)
* v0.55 : Fixes and improvements for the calendar, double loading images and GUI by /u/Garfield69 and /u/Js41637 Thanks guys!!!
* v0.54 : Layout CSS tuning and bugfixes by /u/Js41637 (Thanks!). Support for &micro;Torrent 3.4.1 alpha, Fixed KAT parsing, Added extra permission for huge series (>5mb) databases.
* v0.53 : CSS/layout fixes, Fixed the timers that went missing, fixed the auto-update service, fixed restore watchlist timers, improved memory usage on backup restore.
* v0.52 : Fixed magnet URI catching and saving everywhere you can launch a torrent search for an episode. Added a popup menu on the torrent dialog with access to source, torrent and magnet links for each result
* v0.51 : Fixed several marking episode as watched issues
* v0.50 : Complete UI overhaul, &micro;Torrent integration, experimental Chromecast integration, many performance improvements
* v0.43 : Made sure migrations don't run on fresh installs
* v0.42 : Fixed missing scheduled event and chrome alarm delete procedure when deleting series.
* v0.41 : Fixed 'browser action mode' not launching on icon click.
* v0.40 : Switched to Trakt.TV API. Created backup/restore function. Added seasons. Reworked torrent dialog. Fixed timezone mess. Added Calendar week mode. temporarily disabled browser sync. Added 'download whole season'. Added 'download .torrent' link in dialog.
* v0.35 : Synchronized versions after another manual screwup, created fully automated deployment process using macro's. Fixed 10/10 ratings in overview.
* v0.33 : Updated sync option with permanent sync feature. Added functionality for when remote series are deleted. Multiple styling and consistency updates. Synced date formats. Added episode ratings chart on series overview page.
* v0.32 : Added experimental Sync option. Hit the 'sync' button in settings to push your current series list into the cloud. Open DuckieTV on another computer computer (signed in with the same google account), sit back and watch the magic.
* v0.31 : Fixed grid layout for 1200+px wide screens, Fixed naive TVRage id resolving for something more solid. Now matches both by name and optionally firstaired on multiple matches.
* v0.30  : Renamed from 'SeriesGuide Chrome v2' to DuckieTV! Reworked TVRage parsing to resolve bugs with episode numbering. Special handling for pawn stars like renaming errors means that these have less info to show for now, but more works properly. Implemented adding missing episodes from TVRage (like S01E01 that's missing for a lot of shows).
* v0.28 : Fixed layout bugs, timezone offset for the other half of the world, default settings
* v0.27 : Implemented quality selection for episode search queries in settings. You can now search by default for none/HDTV/480p/720p/1080p
* v0.26 : Fixed a timezone offset bug for historical dates, showing shows that have already aired at the wrong date.
* v0.25 : GUI updates: Made backgrounds blend with black to improve readability, Implemented new settings toggles: 'extra wide calendar' and 'hide torrent searchbox from main page', created switch to show your favorite shows in grid mode (which takes less space), various touchups. 
* v0.24 : Implemented switch preference to select default search provider (ThePirateBay or KickassTorrents) that's used for downloads by default, fixed setting custom tpb proxy gui
* v0.23 : Bugfix release
* v0.22 : Fixed PirateBay search result size parsing, auto-translate breaks it.
* v0.21 : Added setting to disable torrent functionality, Added piratebay mirror resolver and manual override, added setting to hide TopSites, switched to google's site screenshot * service like used on their new tab (the api that I used was getting slow due to the popularity of this)
* v0.20 : Implemented Scene Name Resolver for series that have an alternate scene name 
* v0.19 : Implemented automagic PirateBay Proxy Resolver,  Display filesize for torrents in popup
* v0.18 : Fixed date bug showing items on previous day on calendar.
* v0.17 : Styling improvements, layouting and useability improvements. created #/watchlist url (still hidden for now), torrentfreak top10, mocked up #/settings page
* v0.16 : Fixed TVRage sync and made it automagic
* v0.15 : Cleaned up the layout and merged search engines. 
* v0.14 : TVRage Sync under series details. Fixes wrong episode numbers in the TVDB database for shows like 'Pawn Stars'. (Github #20) Click the Episode number column in the table to * activate.
* v0.13 : Browser Action Mode created
* v0.12 : Added kickass torrent search for when thepiratebay is down. Will be reworked into something nicer soon
* v0.11 : First 'browser action' release
* v0.10 : First public release.

Permissions
===========

Chrome will report that this plugin wants to access your data on all websites and read/modify your browser history.

The permissions are actually less scary than they look. Chrome doesn't have the granular permissions system that Android has, so labels can be confusing versus what they're actually used for.

**Access your data on all websites**

The plugin request permissions to access http://*.*/ to be able to allow any random mirror to be used for The Pirate Bay and custom trackers in the future. Chrome's extension model requires you to whitelist *exactly* the urls that you are accessing, which becomes impossible because of this.

**Read and modify your browser history**

The plugin requests this to use the Chrome.Topsites API that allows to display your most favorite sites on the new tab extension. If you do not wish to give this permission, please use the 'Browser Action' version.

Privacy Statement
=================
**WE DO NOT WANT YOUR DATA**

* The only statistics tracked for DuckieTV are the visits to the public GitHub site (by Google Analytics) and the installations in the Chrome Webstore.
* As soon you install DuckieTV it runs locally without sending statistics anywhere. There is no server to connect to, no infrastructure to bring down, and no logging from DuckieTV’s side of anything you do within the app, and there never will be.
* We do not want your money! We do this in our spare time for fun and to make our own lives and that of other’s easier. There is no business model, no ads, no profit.
* There are no costs to cover: No servers, no hosting, no databases, everything runs on Google's, GitHub's and Reddit's infrastructure. Therefore you are *not* the product and this is extension is free as in free beer.
* Everything runs locally. If you decide to execute a torrent search for an episode, a request goes from your computer to the search engine.

Please open a [GitHub ticket](https://github.com/SchizoDuckie/DuckieTV/issues/new) or start a [Reddit thread](http://reddit.com/r/duckietv/) if there is anything else that needs improvement.

[![forthebadge](http://forthebadge.com/images/badges/built-with-love.svg)](http://forthebadge.com) [![forthebadge](http://forthebadge.com/images/badges/fuck-it-ship-it.svg)](http://forthebadge.com)
