Event Publishers And Listeners
=======================

Throughout Services and Directives in DuckieTV events are published on the $rootScope and subscribed to by others.
This keeps the configuration modular, allows easy extending at key points and prevents tight coupling


Event Descriptions (as at v0.93)
==================
------------------

 -  **$locationChangeSuccess**

   This is an angular-route internal event that will fire when the $location.hash changes.
    It is observed by for instance the seriesList to auto-hide it when clicking a serie from your favorites list. 

 -  **background:load**

    Tells the BackgroundRotator service to load a new background image. 
    The background rotator handles queueing and switching between them.

 -  **calendar:clearcache**

    Tells the calendar to clear it's cache and redraw.

 -  **calendar:events**

    Feed the calendar new events.

 -  **episode:aired:check**

    Fires when the EpisodeAiredService needs to be triggered. Issued by the Torrent Auto-Download option.

 -  **episode:load**

    An episode has been loaded.

 -  **episode:marked:notwatched**

    An episode has been marked as not watched. Observed by Trakt.TV and forwards the marknotwatched call when it's configured.

 -  **episode:marked:watched**

    An episode has been marked as watched. Observed by Trakt.TV and forwards the markwatched call when it's configured.

 -  **episodes:updated**

    Fires when episodes have been updated from trakt.tv

 -  **favorites:updated**

    Fires when a new favorite tv show has been inserted or removed.

 -  **magnet:select:{{TVDB_ID}}**(infohash:string)

    This event is fired by the TorrentDialog when a magnet uri is launched. It passes a torrent's unique 40 character hash so that it can be stored on the episode entity. The calendar and SeriesCtrl observe this event to handle persisting and triggering UI updates (like starting to watch if uTorrent is downloading this torrent by monitoring for torrent:update:{{infohash}})

 -  **katmirrorresolver:status**

    A status update for the KAT mirror resolver was published (used by SettingsCtrl to tap into verification steps).

 -  **serie:load**

    Fires when a serie has been loaded from the database.

 -  **serieslist:empty**

    Fires when the series list is empty. Hooked by the seriesList directive to make it automatically pop up the suggestions when database is empty.

 -  **serieslist:hide**

    Notify the series list that it should hide itself. Fired on navigation change so that it doesn't stay in view.

 -  **setDate**

    Notify that the calendar's date has changed. Fired by the calendar internals and observed by the CalendarEvents provider that fetches and serves the calendar events for the date range currently in view.

 -  **storage:update**

    Notify the SettingsSync service that something has changed in the favorite series list.

 -  **sync:processremoteupdate**

     When the StorageSync service is not already syncing, this make sure that local additions / deletions get stored in the cloud.

 -  **torrent:update:**{{infoHash}}

    Notify the torrentRemoteControl directives that a torrent's data has been updated.

  -  **tpbmirrorresolver:status**

    A status update for the TPB mirror resolver was published (used by SettingsCtrl to tap into verification steps).

-  **video:load**

    Notify ChromeCast to load a video.

 -  **watchlist:check**

    Fires when the watchlist should be checked for updates.

 -  **watchlist:updated**

    Fires when the watchlist is updated.



Graphviz graphs
===============

Event Listeners:
-----------------------
![listeners](http://i.imgur.com/7UTp3Ib.png)

Event Publishers:
------------------
![publishers](http://i.imgur.com/7QoC5ka.png)

You can visualize these graphs online at http://graphviz-dev.appspot.com/ 

For the best results, select the twopi layout engine for both graphs

Listeners
-------------

```
    digraph g {
      splines=true;
      sep="+5,+5";
      overlap=scalexy;
      nodesep=0.2;
      node [fontsize=11];

      Listeners -> ChromeCast [style="invis"];
      Listeners -> DuckieTorrent [style="invis"];
      Listeners -> EpisodeAiredService [style="invis"];
      Listeners -> EpisodeCtrl [style="invis"];
      Listeners -> SerieCtrl [style="invis"];
      Listeners -> SettingsCtrl [style="invis"];
      Listeners -> WatchlistCheckerService [style="invis"];
      Listeners -> WatchlistCtrl [style="invis"];
      Listeners -> app [style="invis"];
      Listeners -> backgroundRotator [style="invis"];
      Listeners -> calendar [style="invis"];
      Listeners -> datePicker [style="invis"];
      Listeners -> seriesList [style="invis"];

      backgroundload -> ChromeCast;
      backgroundload -> backgroundRotator;
      calendarclearcache -> calendar;
      calendarevents -> datePicker;
      episodeairedcheck -> EpisodeAiredService;
      episodeload -> ChromeCast;
      episodemarkednotwatched -> app;
      episodemarkednotwatched -> calendar;
      episodemarkedwatched -> app;
      episodemarkedwatched -> calendar;
      episodesupdated -> SerieCtrl;
      favoritesupdated -> SerieCtrl;
      favoritesupdated -> calendar;
      favoritesupdated -> seriesList;
      katmirrorresolverstatus -> SettingsCtrl;
      locationChangeSuccess -> app;
      magnetselectTVDBID -> EpisodeCtrl;
      magnetselectTVDBID -> SerieCtrl;
      magnetselectTVDBID -> calendar;
      serieload -> ChromeCast;
      serieslistempty -> seriesList;
      serieslisthide -> seriesList;
      setDate -> calendar;
      storageupdate -> SyncManager;
      torrentupdateinfoHash -> DuckieTorrent;
      tpbmirrorresolverstatus -> SettingsCtrl;
      videoload -> ChromeCast;
      watchlistcheck -> WatchlistCheckerService;
      watchlistupdated -> WatchlistCtrl;

      Listeners [style="invis"];

      app [label="app.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        episodemarkednotwatched [label="episode:marked:notwatched", shape=box,fillcolor="white",style="filled"];
        episodemarkedwatched [label="episode:marked:watched", shape=box,fillcolor="white",style="filled"];
        locationChangeSuccess [label="$locationChangeSuccess", shape=box,fillcolor="white",style="filled"];

      backgroundRotator [ label="backgroundRotator.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];

      calendar [ label="calendar.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        calendarclearcache [label="calendar:clearcache", shape=box,fillcolor="white",style="filled"];
        episodesupdated [label="episodes:updated", shape=box,fillcolor="white",style="filled"];
        setDate [label="setDate", shape=box,fillcolor="white",style="filled"];

      ChromeCast [ label="ChromeCast.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        episodeload [label="episode:load", shape=box,fillcolor="white",style="filled"];
        serieload [label="serie:load", shape=box,fillcolor="white",style="filled"];
        videoload [label=" video:load", shape=box,fillcolor="white",style="filled"];

      datePicker [ label="datePicker.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        calendarevents [label="calendar:events", shape=box,fillcolor="white",style="filled"];

      DuckieTorrent [ label="DuckieTorrent.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        torrentupdateinfoHash [label="torrent:update:{{infoHash}}", shape=box,fillcolor="white",style="filled"];

      EpisodeAiredService [ label="EpisodeAiredService.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        episodeairedcheck [label="episode:aired:check", shape=box,fillcolor="white",style="filled"];

      EpisodeCtrl [ label="EpisodeCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];

      SerieCtrl [ label="SerieCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        magnetselectTVDBID [label="magnet:select:{{TVDB_ID}}", shape=box,fillcolor="white",style="filled"];

      seriesList [ label="seriesList.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        favoritesupdated [label="favorites:updated", shape=box,fillcolor="white",style="filled"];
        serieslistempty [label="serieslist:empty", shape=box,fillcolor="white",style="filled"];
        serieslisthide [label="serieslist:hide", shape=box,fillcolor="white",style="filled"];

      SettingsCtrl [ label="SettingsCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        katmirrorresolverstatus [label="katmirrorresolver:status", shape=box,fillcolor="white",style="filled"];
        tpbmirrorresolverstatus [label="tpbmirrorresolver:status", shape=box,fillcolor="white",style="filled"];

      SyncManager [ label="SyncManager.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];

      WatchlistCtrl [ label="WatchlistCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        watchlistupdated [label="watchlist:updated", shape=box,fillcolor="white",style="filled"];

      WatchlistCheckerService [ label="WatchlistCheckerService.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        watchlistcheck [label="watchlist:check", shape=box,fillcolor="white",style="filled"];
    }
```


Publishers
-------------

```
    digraph g {
      splines=true;
      sep="+5,+5";
      overlap="scalexy";
      nodesep=0.2;
      node [fontsize=11];

      Publishers -> CRUDentities [style="invis"];
      Publishers -> DuckieTorrent [style="invis"];
      Publishers -> EpisodeAiredService [style="invis"];
      Publishers -> EpisodeCtrl [style="invis"];
      Publishers -> FavoritesService [style="invis"];
      Publishers -> KickassMirrorResolver [style="invis"];
      Publishers -> SerieCtrl [style="invis"];
      Publishers -> SettingsCtrl [style="invis"];
      Publishers -> ThePirateBayMirrorResolver [style="invis"];
      Publishers -> TorrentCtrl [style="invis"];
      Publishers -> WatchlistService [style="invis"];
      Publishers -> angularjs [style="invis"];
      Publishers -> app [style="invis"];
      Publishers -> background [style="invis"];
      Publishers -> calendar [style="invis"];
      Publishers -> datePicker [style="invis"];
      Publishers -> serieDetails [style="invis"];
      Publishers -> seriesList [style="invis"];
      Publishers -> torrentDialog [style="invis"];

      backgroundload -> EpisodeCtrl [dir="back"];
      backgroundload -> FavoritesService [dir="back"];
      backgroundload -> SerieCtrl [dir="back"];
      backgroundload -> calendar [dir="back"];
      calendarclearcache -> SerieCtrl [dir="back"];
      calendarclearcache -> SettingsCtrl [dir="back"];
      calendarclearcache -> serieDetails [dir="back"];
      calendarevents -> calendar [dir="back"];
      episodeairedcheck -> EpisodeAiredService [dir="back"];
      episodeairedcheck -> SettingsCtrl [dir="back"];
      episodeairedcheck -> app [dir="back"];
      episodeload -> EpisodeCtrl [dir="back"];
      episodemarkednotwatched -> CRUDentities [dir="back"];
      episodemarkedwatched -> CRUDentities [dir="back"];
      episodesupdated -> FavoritesService [dir="back"];
      episodesupdated -> SyncManager [dir="back"];
      favoritesupdated -> FavoritesService [dir="back"];
      katmirrorresolverstatus -> KickassMirrorResolver [dir="back"];
      katmirrorresolverstatus -> SettingsCtrl [dir="back"];
      locationChangeSuccess -> angularjs [dir="back"];
      magnetselectTVDBID -> EpisodeAiredService [dir="back"];
      magnetselectTVDBID -> torrentDialog [dir="back"];
      serieload -> EpisodeCtrl [dir="back"];
      serieload -> SerieCtrl [dir="back"];
      serieslistempty -> FavoritesService [dir="back"];
      serieslisthide -> app [dir="back"];
      setDate -> datePicker [dir="back"];
      storageupdate -> FavoritesService [dir="back"];
      storageupdate -> seriesList [dir="back"];
      syncprocessremoteupdate -> background [dir="back"];
      torrentupdateinfoHash -> DuckieTorrent [dir="back"];
      tpbmirrorresolverstatus -> SettingsCtrl [dir="back"];
      tpbmirrorresolverstatus -> ThePirateBayMirrorResolver [dir="back"];
      videoload -> DuckieTorrent [dir="back"];
      videoload -> TorrentCtrl [dir="back"];
      watchlistupdated -> WatchlistService [dir="back"];

      Publishers [style="invis"];

      angularjs [label="angular.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        locationChangeSuccess [label="$locationChangeSuccess", shape=box,fillcolor="white",style="filled"];

      app [label="app.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        serieslisthide [label="serieslist:hide", shape=box,fillcolor="white",style="filled"];

      background [label="Background.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        syncprocessremoteupdate [label="sync:processremoteupdate", shape=box,fillcolor="white",style="filled"];

      calendar [label="calendar.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        calendarevents [label="calendar:events", shape=box,fillcolor="white",style="filled"];

      CRUDentities [label="CRUD.entities.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        episodemarkedwatched [label="episode:marked:watched",shape=box,fillcolor="white",style="filled"];
        episodemarkednotwatched [label="episode:marked:notwatched", shape=box,fillcolor="white",style="filled"];

      datePicker [label="datePicker.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        setDate [label="setDate", shape=box,fillcolor="white",style="filled"];

      DuckieTorrent [label="DuckieTorrent.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        torrentupdateinfoHash [label="torrent:update:{{infoHash}}", shape=box,fillcolor="white",style="filled"];
        videoload [label="video:load", shape=box,fillcolor="white",style="filled"];

      EpisodeAiredService [label="EpisodeAiredService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        episodeairedcheck [label="episode:aired:check", shape=box,fillcolor="white",style="filled"];

      EpisodeCtrl [label="EpisodeCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        serieload [label="serie:load", shape=box,fillcolor="white",style="filled"];
        episodeload [label="episode:load", shape=box,fillcolor="white",style="filled"];
        backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];

      FavoritesService [label="FavoritesService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        calendarclearcache [label="calendar:clearcache", shape=box,fillcolor="white",style="filled"];
        episodesupdated [label="episodes:updated", shape=box,fillcolor="white",style="filled"];
        favoritesupdated [label="favorites:updated", shape=box,fillcolor="white",style="filled"];
        serieslistempty [label="serieslist:empty", shape=box,fillcolor="white",style="filled"];
        storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];

      KickassMirrorResolver [label="KickassMirrorResolver.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        katmirrorresolverstatus [label="katmirrorresolver:status", shape=box,fillcolor="white",style="filled"];

      SerieCtrl [label="SerieCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      serieDetails [label="serieDetails.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      seriesList [label="seriesList.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      SettingsCtrl [label="SettingsCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      SyncManager [label="SyncManager.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      TorrentCtrl [label="TorrentCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      torrentDialog [label="torrentDialog.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        magnetselectTVDBID [label="magnet:select:{{TVDB_ID}}", shape=box,fillcolor="white",style="filled"];

      ThePirateBayMirrorResolver [label="ThePirateBayMirrorResolver.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        tpbmirrorresolverstatus [label="tpbmirrorresolver:status", shape=box,fillcolor="white",style="filled"];

      WatchlistService [label="WatchlistService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        watchlistupdated [label="watchlist:updated", shape=box,fillcolor="white",style="filled"];
    }
```
