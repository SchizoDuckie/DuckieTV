Event Publishers And Listeners
=======================

Throughout Services and Directives in DuckieTV, events are published on the $rootScope and subscribed to by others.
This keeps the configuration modular, allows easy extending at key points and prevents tight coupling.


Event Descriptions (as at v1.1.4)
==================
------------------

 -  **$stateChangeStart**

   This is an angular-route internal event that will fire when the $state begins changing.
    Used to manage Sidepanel activity.

 -  **$stateChangeSuccess**

   This is an angular-route internal event that will fire when the $state has changed.
    Used to manage Sidepanel activity.

 -  **autodownload:activity**

    Tells the Auto-Download-Status monitor that the Auto-Download service has processed an episode's torrent search.

 -  **background:load**

    Tells the BackgroundRotator service to load a new background image.
    The background rotator handles queueing and switching between them.

 -  **calendar:setdate**

    Tells the calendar to refresh using supplied new date.

 -  **episode:marked:notwatched**

    An episode has been marked as not watched. Observed by Trakt.TV and forwards the marknotwatched call when it's configured.

 -  **episode:marked:watched**

    An episode has been marked as watched. Observed by TraktTVv2 and EpisodeWatchedMonitor and forwards the markwatched call when it's configured.

 -  **episodes:updated**

    Fires when episodes have been updated from trakt.tv
    *WIP Will be listened for by the SyncManager.*

 -  **expand:serie**

    Fired by the CalendarEvents provider when a user clicks on a calendar's condensed event's badge icon, and observed by the calendar internals to perform the expansion of that condensed list of events for viewing.

 -  **katmirrorresolver:status**

    A status update for the KAT mirror resolver. (Used by SettingsTorrentCtrl to tap into verification steps).

 -  **locationreload**

    Used to signal that a page reload is required, giving standalone the change to perform some house keeping.

 -  **magnet:select:{{TVDB_ID}}{{infohash}}**

    This event is fired by the AutoDownloadService and TorrentSearchEngines when a magnet uri is launched. It passes a torrent's unique 40 character hash so that it can be stored on the episode entity. The SidepanelEpisodeCtrl and SidepanelSeasonCtrl observe this event to handle persisting and triggering UI updates (like starting to watch if a TorrentClient is downloading this torrent by monitoring for torrent:update:{{infohash}})

 -  **restoredtv**

    Used internally by systray logic to signal that the hidden shound now be seen.

 -  **serie:recount:watched**

    Used to signal that a series needs to have its watched episodes re-counted.

 -  **series:recount:watched**

    Used to signal that all series need to have their watched episodes re-counted.

 -  **serieslist:empty**

    Fires when the series list is empty. Hooked by the seriesList directive to make it automatically pop up the suggestions when database is empty.

 -  **serieslist:{{filter}}**(filter|genreFilter|statusFilter)

     Tells the SeriesListCtrl to filter the library with the user's filter string, or selected genre or selected status.

 -  **setDate**

    Notify that the calendar's date has changed. Fired by the calendar internals and observed by the CalendarEvents provider that fetches and serves the calendar events for the date range currently in view.

 -  **standalone:{{menuItem}}**(adlstatus|calendar|favorites|settings|about)

   Used by standalone to signal the usage of a systray menu item so it can be actioned.

 -  **storage:update**

    Notify the SyncManager service that something has changed in the favorite series list.

 -  **sync:processremoteupdate**

     When the SyncManager service is not already syncing, this make sure that local additions / deletions get stored in the cloud.
     *WIP Listener in place but Publisher yet to be created.*

 -  **torrent:update:**{{infoHash}}

    Notify the TorrentClients that a torrent's data has been updated. Used Internally.

 -  **torrentclient:connected**

    Used to indicate that the torrentClient has connected with it's host, so that dependant processes can start processing torrents.

 -  **tpbmirrorresolver:status**

    A status update for the TPB mirror resolver was published (used by SettingsTorrentCtrl to tap into verification steps).

 -  **watchlist:updated**

    Fires when the watchlist is updated.

 -  **winstate**

    Used by standalone to signal changes in the window state (maximised, normal) so it can be saved.



Graphviz graphs
===============

Event Listeners:
-----------------------
![listeners](http://i.imgur.com/hTmRkcY.png)

Event Publishers:
------------------
![publishers](http://i.imgur.com/SJwTgrp.png)

Listeners
-------------

```
    digraph g {
      splines=true;
      sep="+5,+5";
      overlap=scalexy;
      nodesep=0.2;
      node [fontsize=11];

      Listeners -> app [style="invis"];
      Listeners -> appsystray [style="invis"];
      Listeners -> ActionBarCtrl [style="invis"];
      Listeners -> AutodlstatusCtrl [style="invis"];
      Listeners -> SidepanelEpisodeCtrl [style="invis"];
      Listeners -> SidepanelSeasonCtrl [style="invis"];
      Listeners -> backgroundRotator [style="invis"];
      Listeners -> TraktTVv2 [style="invis"];
      Listeners -> EpisodeWatchedMonitor [style="invis"];
      Listeners -> calendar [style="invis"];
      Listeners -> datePicker [style="invis"];
      Listeners -> FavoritesService [style="invis"];
      Listeners -> SeriesListCtrl [style="invis"];
      Listeners -> SettingsTorrentCtrl [style="invis"];
      Listeners -> SyncManager [style="invis"];
      Listeners -> BaseTorrentClient [style="invis"];
      Listeners -> uTorrent [style="invis"];
      Listeners -> AutoDownloadService [style="invis"];
      Listeners -> TorrentCtrl [style="invis"];
      Listeners -> TorrentRemoteControl [style="invis"];
      Listeners -> WatchlistCtrl [style="invis"];

      autodownloadactivity -> AutodlstatusCtrl;
      backgroundload -> backgroundRotator;
      calendarsetdate -> datePicker;
      episodemarkednotwatched -> EpisodeWatchedMonitor;
      episodemarkednotwatched -> TraktTVv2;
      episodemarkedwatched -> EpisodeWatchedMonitor;
      episodemarkedwatched -> TraktTVv2;
      expandserie -> datePicker;
      katmirrorresolverstatus -> SettingsTorrentCtrl;
      locationreload -> appsystray;
      magnetselectTVDBID -> AutodlstatusCtrl;
      magnetselectTVDBID -> SidepanelEpisodeCtrl;
      magnetselectTVDBID -> SidepanelSeasonCtrl;
      restoredtv -> appsystray;
      serierecountwatched -> EpisodeWatchedMonitor;
      seriesrecountwatched -> EpisodeWatchedMonitor;
      serieslistempty -> FavoritesService;
      serieslistfilter -> SeriesListCtrl;
      setDate -> calendar;
      stateChangeStart -> app;
      standalonemenuitem -> ActionBarCtrl;
      stateChangeSuccess -> app;
      storageupdate -> SyncManager;
      syncprocessremoteupdate -> SyncManager;
      torrentclientconnected -> AutoDownloadService;
      torrentclientconnected -> TorrentCtrl;
      torrentclientconnected -> TorrentRemoteControl;
      torrentupdateinfoHash -> BaseTorrentClient;
      torrentupdateinfoHash -> uTorrent;
      tpbmirrorresolverstatus -> SettingsTorrentCtrl;
      watchlistupdated -> WatchlistCtrl;
      winstate -> appsystray;

      Listeners [style="invis"];

      ActionBarCtrl [label="ActionBarCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        standalonemenuitem [label="standalone:{{menuitem}}", shape=box,fillcolor="white",style="filled"];

      app [label="app.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        stateChangeStart [label="$stateChangeStart", shape=box,fillcolor="white",style="filled"];
        stateChangeSuccess [label="$stateChangeSuccess", shape=box,fillcolor="white",style="filled"];

      appsystray [label="app.standalone.systray.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        locationreload [label="locationreload", shape=box,fillcolor="white",style="filled"];
        restoredtv [label="restoredtv", shape=box,fillcolor="white",style="filled"];
        winstate [label="winstate", shape=box,fillcolor="white",style="filled"];

      AutoDownloadService [ label="AutoDownloadService.js", shape=box,fillcolor="#efefef",color="white",style="filled"];

      AutodlstatusCtrl [ label="AutodlstatusCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        autodownloadactivity [label="autodownload:activity", shape=box,fillcolor="white",style="filled"];

      backgroundRotator [ label="backgroundRotator.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];

      BaseTorrentClient [ label="BaseTorrentClient.js", shape=box,fillcolor="#efefef",color="white",style="filled"];

      calendar [ label="calendar.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        setDate [label="setDate", shape=box,fillcolor="white",style="filled"];

      datePicker [ label="datePicker.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        calendarsetdate [label="calendar:setdate", shape=box,fillcolor="white",style="filled"];
        expandserie [label="expand:serie", shape=box,fillcolor="white",style="filled"];

      EpisodeWatchedMonitor [ label="EpisodeWatchedMonitor.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        serierecountwatched [label="serie:recount:watched", shape=box,fillcolor="white",style="filled"];
        seriesrecountwatched [label="series:recount:watched", shape=box,fillcolor="white",style="filled"];

      FavoritesService [ label="FavoritesService.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        serieslistempty [label="serieslist:empty", shape=box,fillcolor="white",style="filled"];

      SeriesListCtrl [ label="SeriesListCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        serieslistfilter [label="serieslist:{{filter}}", shape=box,fillcolor="white",style="filled"];

      SettingsTorrentCtrl [ label="SettingsTorrentCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        katmirrorresolverstatus [label="katmirrorresolver:status", shape=box,fillcolor="white",style="filled"];
        tpbmirrorresolverstatus [label="tpbmirrorresolver:status", shape=box,fillcolor="white",style="filled"];

      SidepanelEpisodeCtrl [ label="SidepanelEpisodeCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        magnetselectTVDBID [label="magnet:select:{{TVDB_ID}}{{infoHash}}", shape=box,fillcolor="white",style="filled"];

      SidepanelSeasonCtrl [ label="SidepanelSeasonCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];

      SyncManager [ label="SyncManager.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        syncprocessremoteupdate [label="sync:processremoteupdate", shape=box,fillcolor="white",style="filled"];
        storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];

      TorrentCtrl [label="TorrentCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];

      TorrentRemoteControl [label="TorrentRemoteControl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        torrentclientconnected [label="torrentclient:connected", shape=box,fillcolor="white",style="filled"];

      TraktTVv2 [label="TraktTVv2.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        episodemarkednotwatched [label="episode:marked:notwatched", shape=box,fillcolor="white",style="filled"];
        episodemarkedwatched [label="episode:marked:watched", shape=box,fillcolor="white",style="filled"];

      uTorrent [ label="uTorrent.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        torrentupdateinfoHash [label="torrent:update:{{infoHash}}", shape=box,fillcolor="white",style="filled"];

      WatchlistCtrl [ label="WatchlistCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        watchlistupdated [label="watchlist:updated", shape=box,fillcolor="white",style="filled"];
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

      Publishers -> app [style="invis"];
      Publishers -> appsystray [style="invis"];
      Publishers -> appwindow [style="invis"];
      Publishers -> ActionBarCtrl [style="invis"];
      Publishers -> angularjs [style="invis"];
      Publishers -> calendar [style="invis"];
      Publishers -> CRUDentities [style="invis"];
      Publishers -> datePicker [style="invis"];
      Publishers -> AutoDownloadService [style="invis"];
      Publishers -> TorrentSearchEngines [style="invis"];
      Publishers -> MigrationService [style="invis"];
      Publishers -> TraktTVCtrl [style="invis"];
      Publishers -> ThePirateBayMirrorResolver [style="invis"];
      Publishers -> KickassMirrorResolver [style="invis"];
      Publishers -> SettingsTorrentCtrl [style="invis"];
      Publishers -> calendarEvent [style="invis"];
      Publishers -> FavoritesService [style="invis"];
      Publishers -> SidepanelSeasonsCtrl [style="invis"];
      Publishers -> SidepanelSeasonCtrl [style="invis"];
      Publishers -> SidepanelSerieCtrl [style="invis"];
      Publishers -> BackupCtrl [style="invis"];
      Publishers -> FastSearch [style="invis"];
      Publishers -> SeriesListCtrl [style="invis"];
      Publishers -> LocalSeriesCtrl [style="invis"];
      Publishers -> SyncManager [style="invis"];
      Publishers -> BaseTorrentClient [style="invis"];
      Publishers -> uTorrent [style="invis"];
      Publishers -> WatchlistService [style="invis"];

      autodownloadactivity -> AutoDownloadService [dir="back"];
      backgroundload -> calendarEvent [dir="back"];
      backgroundload -> FavoritesService [dir="back"];
      calendarsetdate -> ActionBarCtrl [dir="back"];
      episodemarkednotwatched -> CRUDentities [dir="back"];
      episodemarkedwatched -> CRUDentities [dir="back"];
      episodesupdated -> SyncManager [dir="back"];
      expandserie -> calendar [dir="back"];
      katmirrorresolverstatus -> KickassMirrorResolver [dir="back"];
      katmirrorresolverstatus -> SettingsTorrentCtrl [dir="back"];
      locationreload -> app [dir="back"];
      restoredtv -> appsystray [dir="back"];
      magnetselectTVDBID -> AutoDownloadService [dir="back"];
      magnetselectTVDBID -> TorrentSearchEngines [dir="back"];
      serierecountwatched -> FavoritesService [dir="back"];
      serierecountwatched -> SeriesListCtrl [dir="back"];
      serierecountwatched -> SidepanelSeasonCtrl [dir="back"];
      serierecountwatched -> SidepanelSeasonsCtrl [dir="back"];
      serierecountwatched -> SidepanelSerieCtrl [dir="back"];
      seriesrecountwatched -> TraktTVCtrl [dir="back"];
      seriesrecountwatched -> MigrationService [dir="back"];
      serieslistempty -> FavoritesService [dir="back"];
      serieslistfilter -> LocalSeriesCtrl [dir="back"];
      setDate -> datePicker [dir="back"];
      standalonemenuitem -> appsystray [dir="back"];
      stateChangeStart -> angularjs [dir="back"];
      stateChangeSuccess -> angularjs [dir="back"];
      storageupdate -> BackupCtrl [dir="back"];
      storageupdate -> FastSearch [dir="back"];
      storageupdate -> FavoritesService [dir="back"];
      storageupdate -> SeriesListCtrl [dir="back"];
      storageupdate -> SidepanelSerieCtrl [dir="back"];
      torrentclientconnected -> BaseTorrentClient [dir="back"];
      torrentclientconnected -> uTorrent [dir="back"];
      torrentupdateinfoHash -> BaseTorrentClient [dir="back"];
      torrentupdateinfoHash -> uTorrent [dir="back"];
      tpbmirrorresolverstatus -> SettingsTorrentCtrl [dir="back"];
      tpbmirrorresolverstatus -> ThePirateBayMirrorResolver [dir="back"];
      watchlistupdated -> WatchlistService [dir="back"];
      winstate -> appwindow [dir="back"];

      Publishers [style="invis"];

      app [label="app.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        locationreload [label="locationreload", shape=box,fillcolor="white",style="filled"];

      appsystray [label="app.standalone.systray.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        restoredtv [label="restoredtv", shape=box,fillcolor="white",style="filled"];
        standalonemenuitem [label="standalone:{{menuitem}}", shape=box,fillcolor="white",style="filled"];

        appwindow [label="app.standalone.windowdressing.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        winstate [label="winstate", shape=box,fillcolor="white",style="filled"];

      ActionBarCtrl [label="ActionBarCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        calendarsetdate [label="calendar:setdate", shape=box,fillcolor="white",style="filled"];

      angularjs [label="angular.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        stateChangeStart [label="$stateChangeStart", shape=box,fillcolor="white",style="filled"];
        stateChangeSuccess [label="$stateChangeSuccess", shape=box,fillcolor="white",style="filled"];

      BackupCtrl [label="BackupCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      BaseTorrentClient [label="BaseTorrentClient.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        torrentclientconnected [label="torrentclient:connected", shape=box,fillcolor="white",style="filled"];

      calendar [label="calendar.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        expandserie [label="expand:serie", shape=box,fillcolor="white",style="filled"];

      calendarEvent [label="calendarEvent.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];

      CRUDentities [label="CRUD.entities.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        episodemarkedwatched [label="episode:marked:watched",shape=box,fillcolor="white",style="filled"];
        episodemarkednotwatched [label="episode:marked:notwatched", shape=box,fillcolor="white",style="filled"];

      datePicker [label="datePicker.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        setDate [label="setDate", shape=box,fillcolor="white",style="filled"];

      AutoDownloadService [label="AutoDownloadService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        autodownloadactivity [label="autodownload:activity", shape=box,fillcolor="white",style="filled"];

      FastSearch [label="FastSearch.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      FavoritesService [label="FavoritesService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        serieslistempty [label="serieslist:empty", shape=box,fillcolor="white",style="filled"];
        storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];

      KickassMirrorResolver [label="KickassMirrorResolver.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        katmirrorresolverstatus [label="katmirrorresolver:status", shape=box,fillcolor="white",style="filled"];

      LocalSeriesCtrl [label="LocalSeriesCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        serieslistfilter [label="serieslist:{{filter}}", shape=box,fillcolor="white",style="filled"];

      MigrationService [label="MigrationService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      SeriesListCtrl [label="SeriesListCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      SettingsTorrentCtrl [label="SettingsTorrentCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        serierecountwatched [label="serie:recount:watched", shape=box,fillcolor="white",style="filled"];

      SidepanelSeasonCtrl [label="SidepanelSeasonCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      SidepanelSeasonsCtrl [label="SidepanelSeasonsCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      SidepanelSerieCtrl [label="SidepanelSerieCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      SyncManager [label="SyncManager.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        episodesupdated [label="episodes:updated", shape=box,fillcolor="white",style="filled"];

      ThePirateBayMirrorResolver [label="ThePirateBayMirrorResolver.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        tpbmirrorresolverstatus [label="tpbmirrorresolver:status", shape=box,fillcolor="white",style="filled"];

      TorrentSearchEngines [label="TorrentSearchEngines.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        magnetselectTVDBID [label="magnet:select:{{TVDB_ID}}{{infoHash}}", shape=box,fillcolor="white",style="filled"];

      TraktTVCtrl [label="TraktTVCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        seriesrecountwatched [label="series:recount:watched", shape=box,fillcolor="white",style="filled"];

      uTorrent [label="uTorrent.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        torrentupdateinfoHash [label="torrent:update:{{infoHash}}", shape=box,fillcolor="white",style="filled"];

      WatchlistService [label="WatchlistService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        watchlistupdated [label="watchlist:updated", shape=box,fillcolor="white",style="filled"];
    }
```
