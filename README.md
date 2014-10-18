DuckieTV for Chrome, Opera and Online
=====================================

DuckieTV is a Google Chrome / Opera extension that takes care of TV-Show addicts by providing a personalized TV-Show calendar. DuckieTV makes sure the information is always up-to-date and gives you an integrated blocking-resistant torrent search to help you get to the right download as easy as possible.


With the integrated DuckieTorrent client you can connect DuckieTV to your local &micro;Torrent/BitTorrent client and be updated on the download progress without switching applications. Experimental ChromeCast integration even provides the possibility to stream videos to your TV while still downloading.


As of v0.60 DuckieTV also is also finally becoming a worthy SickBeard competitor by introducing an automatic downloading of shows that have aired and translations into 11 languages. (English, Deutch, Español, Français, Italiano, 日本, 한국어, Nederlands, Purtugese, Русский, Svenska, 简体中文 )

How can I get it?
=================

DuckieTV can be installed as either a Chrome Extension or an Opera Extension, and you can try the basic features in the online version. 

Install DuckieTV For Chrome
---------------------------
DuckieTV for Chrome comes in 2 versions: One that installs itself as your browser's "new tab" page, and one that just provides an easily accessible button to open DuckieTV. 

* [DuckieTV 'New Tab mode': Installs itself as your new tab page](https://chrome.google.com/webstore/detail/hkbamkappmgfjjahmnlngibomenmbbdf/)
* [DuckieTV 'Browser Action mode': Adds a button next to your address bar](https://chrome.google.com/webstore/detail/cdfkaloficjmdjbgmckaddgfcghgidei/)

Install DuckieTV for Opera
--------------------------
* [DuckieTV 'Browser Action mode': Adds a button next to your addres bar](https://addons.opera.com/en-gb/extensions/details/duckietv-browser-action-mode/)

Try DuckieTV online
-------------------
* You can now also try DuckieTV online, provided you have Chrome, Safari, Opera or an Android browser. Note that it is using a third party service to work around cross-domain limitations and can be broken at any time.
  Try it [here](http://DuckieTV.github.io/DuckieTV/)

Screenshots:
============
**Your main screen is a beautiful calendar with backgrounds tailored to the shows you are watching**
!['New Tab' mode](http://i.imgur.com/B5jtvrf.png)

**Instant access to &micro;Torrent/BitTorrent features from the calendar**
![Stream with uTorrent player](http://i.imgur.com/h6OnmHO.png)

**Add your favorite shows by picking them off of TraktTV's Trending Shows list, or search manually**
![Add new shows with ease, pick from Trak.TV's trending shows](http://i.imgur.com/bUzCDbo.png)

**Navigate to any of your shows easily by opening the "series you're watching" panel**
!['Shows you are watching'](http://i.imgur.com/EYloHBq.png)

**Forgot to mark your shows as watched? Batch mode enables to mark a whole range of shows at once.**
![Batch mark episodes as watched](http://i.imgur.com/m98zwID.png)

**Control various settings to adjust DuckieTV to your needs**
![Settings](http://i.imgur.com/Jr5l0PX.png)

**DuckieTV comes translated into 11 languages**
![Comes in 11 languages](http://i.imgur.com/KOCzdSM.png)

**You can either completely turn off Torrent integration or tune it to your preference**
![Torrent Settings](http://i.imgur.com/GWDLCLh.png)

**DuckieTorrent &micro;Torrent/BitTorrent client built-in**
![DuckieTorrent uTorrent integration](http://i.imgur.com/dTdt1DH.png)


Changelog: 
==========
* v0.75 : Easily delete shows from series you're watching, Database write indicators, Improved error handling and credentials validation for Trakt.TV, Update mechanism improved to handle TheTVDB reassigning ID's (fixing duplicate/disappearing shows on your calendar after an update), IMDB / Wikipedia links on the show details page, Added ability to hide 'Specials' for shows (like Dr. Who), Bandwidth consumption improvements, Shows that have ended will now only be checked for updates every 2 weeks, Fixed Torrent Dialog search box to automatically grab keyboard focus, Torrent auto-download service now runs every 2 hours instead of every 4 hours, Fixed 'Scenename' lookup for downloads.
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
**I DO NOT WANT YOUR DATA**

* The only statistics tracked are the installations by google analytics and visits to the public github site.
* As soon you install this plugin it runs locally without sending statistics anywhere. There is no logging from my side of anything you do within this plugin and there never will be.
* I do not want your money, I do this in my spare time for fun and to make my own life and that of other's easier. There is no business model.
* There are no costs to cover: No servers, no hosting, no databases, everything runs on google's, github's and reddit's infrastructure. Therefore you are *not* the product and this is extension is free as in free beer.
* Everything runs locally. If you decide to execute a torrent search for an episode, a request goes from your computer to the search engine.

Please open a github ticket or start a [reddit thread](http://reddit.com/r/duckietv/) if there is anything else that needs improvement. And remember, this is a beta.
