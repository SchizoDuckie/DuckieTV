Event Publishers And Listeners
=======================

Throughout Services and Directives in DuckieTV, events are published on the $rootScope and subscribed to by others.
This keeps the configuration modular, allows easy extending at key points and prevents tight coupling.


Event Descriptions (as at v1.0.1)
==================
------------------

 -  **$stateChangeStart**

   This is an angular-route internal event that will fire when the $state begins changing.
    Used to manage Sidepanel activity. 

 -  **$stateChangeSuccess**

   This is an angular-route internal event that will fire when the $state has changed.
    Used to manage Sidepanel activity. 

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

 -  **magnet:select:{{TVDB_ID}}**(infohash:string)

    This event is fired by the AutoDownloadService and TorrentSearchEngines when a magnet uri is launched. It passes a torrent's unique 40 character hash so that it can be stored on the episode entity. The SidepanelEpisodeCtrl and SidepanelSeasonCtrl observe this event to handle persisting and triggering UI updates (like starting to watch if a TorrentClient is downloading this torrent by monitoring for torrent:update:{{infohash}})

 -  **serie:updating**

    Used internally by SidepanelSerieCtrl to notify when an add-a-series process in active.

 -  **serieslist:empty**

    Fires when the series list is empty. Hooked by the seriesList directive to make it automatically pop up the suggestions when database is empty.

 -  **setDate**

    Notify that the calendar's date has changed. Fired by the calendar internals and observed by the CalendarEvents provider that fetches and serves the calendar events for the date range currently in view.

 -  **storage:update**

    Notify the SyncManager service that something has changed in the favorite series list.

 -  **serieslist:filter**

     Tells the SeriesListCtrl to filter the library with the user's filter string.

 -  **sync:processremoteupdate**

     When the SyncManager service is not already syncing, this make sure that local additions / deletions get stored in the cloud.
     *WIP Listener in place but Publisher yet to be created.*

 -  **torrent:update:**{{infoHash}}

    Notify the TorrentClients that a torrent's data has been updated. Used Internally.

 -  **tpbmirrorresolver:status**

    A status update for the TPB mirror resolver was published (used by SettingsTorrentCtrl to tap into verification steps).

 -  **traktserie:preview**

    Tells the SidepanelTraktSerieCtrl to display preview details of a selected series. 

 -  **watchlist:updated**

    Fires when the watchlist is updated.



Graphviz graphs
===============

Event Listeners:
-----------------------
![listeners](http://i.imgur.com/9Uk7pfR.png)

Event Publishers:
------------------
![publishers](http://i.imgur.com/ike9fIK.png)

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

      Listeners -> app [style="invis"];
      Listeners -> backgroundRotator [style="invis"];
      Listeners -> TraktTVv2 [style="invis"];
      Listeners -> calendar [style="invis"];
      Listeners -> datePicker [style="invis"];
      Listeners -> FavoritesService [style="invis"];
      Listeners -> SeriesListCtrl [style="invis"];
      Listeners -> SettingsTorrentCtrl [style="invis"];
      Listeners -> SidepanelEpisodeCtrl [style="invis"];
      Listeners -> SidepanelSeasonCtrl [style="invis"];
      Listeners -> SidepanelSerieCtrl [style="invis"];
      Listeners -> SidepanelTraktSerieCtrl [style="invis"];
      Listeners -> SyncManager [style="invis"];
      Listeners -> qBittorrent [style="invis"];
      Listeners -> Tixati [style="invis"];
      Listeners -> Transmission [style="invis"];
      Listeners -> uTorrent [style="invis"];
      Listeners -> WatchlistCtrl [style="invis"];
 
      backgroundload -> backgroundRotator;
      calendarsetdate -> datePicker;
      episodemarkednotwatched -> calendar;
      episodemarkednotwatched -> TraktTVv2;
      episodemarkedwatched -> calendar;
      episodemarkedwatched -> TraktTVv2;
      expandserie -> datePicker;
      katmirrorresolverstatus -> SettingsTorrentCtrl;
      magnetselectTVDBID -> SidepanelEpisodeCtrl;
      magnetselectTVDBID -> SidepanelSeasonCtrl;
      serieslistempty -> FavoritesService;
      serieslistfilter -> SeriesListCtrl;
      serieupdating -> SidepanelSerieCtrl;
      setDate -> calendar;
      stateChangeStart -> app;
      stateChangeSuccess -> app;
      storageupdate -> SyncManager;
      torrentupdateinfoHash -> qBittorrent;
      torrentupdateinfoHash -> Tixati;
      torrentupdateinfoHash -> Transmission;
      torrentupdateinfoHash -> uTorrent;
      tpbmirrorresolverstatus -> SettingsTorrentCtrl;
      traktseriepreview -> SidepanelTraktSerieCtrl;
      watchlistupdated -> WatchlistCtrl;

      Listeners [style="invis"];

      app [label="app.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        stateChangeStart [label="$stateChangeStart", shape=box,fillcolor="white",style="filled"];
        stateChangeSuccess [label="$stateChangeSuccess", shape=box,fillcolor="white",style="filled"];

      backgroundRotator [ label="backgroundRotator.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];

      calendar [ label="calendar.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        setDate [label="setDate", shape=box,fillcolor="white",style="filled"];

      datePicker [ label="datePicker.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        calendarsetdate [label="calendar:setdate", shape=box,fillcolor="white",style="filled"];
        expandserie [label="expand:serie", shape=box,fillcolor="white",style="filled"];

      FavoritesService [ label="FavoritesService.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        serieslistempty [label="serieslist:empty", shape=box,fillcolor="white",style="filled"];

      qBittorrent [ label="qBittorrent.js", shape=box,fillcolor="#efefef",color="white",style="filled"];

      SeriesListCtrl [ label="SeriesListCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        serieslistfilter [label="serieslist:filter", shape=box,fillcolor="white",style="filled"];

      SettingsTorrentCtrl [ label="SettingsTorrentCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        katmirrorresolverstatus [label="katmirrorresolver:status", shape=box,fillcolor="white",style="filled"];
        tpbmirrorresolverstatus [label="tpbmirrorresolver:status", shape=box,fillcolor="white",style="filled"];

      SidepanelEpisodeCtrl [ label="SidepanelEpisodeCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        magnetselectTVDBID [label="magnet:select:{{TVDB_ID}}", shape=box,fillcolor="white",style="filled"];

      SidepanelSeasonCtrl [ label="SidepanelSeasonCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];

      SidepanelSerieCtrl [ label="SidepanelSerieCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        serieupdating [label="serie:updating", shape=box,fillcolor="white",style="filled"];

      SidepanelTraktSerieCtrl [ label="SidepanelTraktSerieCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        traktseriepreview [label="traktserie:preview", shape=box,fillcolor="white",style="filled"];

      SyncManager [ label="SyncManager.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];

      Tixati [ label="Tixati.js", shape=box,fillcolor="#efefef",color="white",style="filled"];

      TraktTVv2 [label="TraktTVv2.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        episodemarkednotwatched [label="episode:marked:notwatched", shape=box,fillcolor="white",style="filled"];
        episodemarkedwatched [label="episode:marked:watched", shape=box,fillcolor="white",style="filled"];

      Transmission [ label="Transmission.js", shape=box,fillcolor="#efefef",color="white",style="filled"];

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

      Publishers -> ActionBarCtrl [style="invis"];
      Publishers -> angularjs [style="invis"];
      Publishers -> background [style="invis"];
      Publishers -> calendar [style="invis"];
      Publishers -> calendarEvent [style="invis"];
      Publishers -> FavoritesService [style="invis"];
      Publishers -> SeriesListCtrl [style="invis"];
      Publishers -> CRUDentities [style="invis"];
      Publishers -> datePicker [style="invis"];
      Publishers -> AutoDownloadService [style="invis"];
      Publishers -> TorrentSearchEngines [style="invis"];
      Publishers -> KickassMirrorResolver [style="invis"];
      Publishers -> SyncManager [style="invis"];
      Publishers -> ThePirateBayMirrorResolver [style="invis"];
      Publishers -> TraktTVSearchCtrl [style="invis"];
      Publishers -> TraktTVTrendingCtrl [style="invis"];
      Publishers -> qBittorrent [style="invis"];
      Publishers -> Tixati [style="invis"];
      Publishers -> Transmission [style="invis"];
      Publishers -> uTorrent [style="invis"];
      Publishers -> WatchlistService [style="invis"];

      backgroundload -> calendarEvent [dir="back"];
      backgroundload -> FavoritesService [dir="back"];
      calendarsetdate -> ActionBarCtrl [dir="back"];
      episodemarkednotwatched -> CRUDentities [dir="back"];
      episodemarkedwatched -> CRUDentities [dir="back"];
      expandserie -> calendar [dir="back"];
      katmirrorresolverstatus -> KickassMirrorResolver [dir="back"];
      katmirrorresolverstatus -> SettingsTorrentCtrl [dir="back"];
      magnetselectTVDBID -> AutoDownloadService [dir="back"];
      magnetselectTVDBID -> TorrentSearchEngines [dir="back"];
      serieslistempty -> FavoritesService [dir="back"];
      serieslistfilter -> LocalSeriesCtrl [dir="back"];
      serieupdating -> SidepanelSerieCtrl [dir="back"];
      setDate -> datePicker [dir="back"];
      stateChangeStart -> angularjs [dir="back"];
      stateChangeSuccess -> angularjs [dir="back"];
      storageupdate -> FavoritesService [dir="back"];
      storageupdate -> SeriesListCtrl [dir="back"];
      storageupdate -> SidepanelSerieCtrl [dir="back"];
      syncprocessremoteupdate -> background [dir="back"];
      torrentupdateinfoHash -> qBittorrent [dir="back"];
      torrentupdateinfoHash -> Transmission [dir="back"];
      torrentupdateinfoHash -> Tixati [dir="back"];
      torrentupdateinfoHash -> uTorrent [dir="back"];
      tpbmirrorresolverstatus -> SettingsTorrentCtrl [dir="back"];
      tpbmirrorresolverstatus -> ThePirateBayMirrorResolver [dir="back"];
      traktseriepreview -> TraktTVSearchCtrl [dir="back"];
      traktseriepreview -> TraktTVTrendingCtrl [dir="back"];
      watchlistupdated -> WatchlistService [dir="back"];

      Publishers [style="invis"];

      ActionBarCtrl [label="ActionBarCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        calendarsetdate [label="calendar:setdate", shape=box,fillcolor="white",style="filled"];

      angularjs [label="angular.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        stateChangeStart [label="$stateChangeStart", shape=box,fillcolor="white",style="filled"];
        stateChangeSuccess [label="$stateChangeSuccess", shape=box,fillcolor="white",style="filled"];

      background [label="Background.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

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

      FavoritesService [label="FavoritesService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        serieslistempty [label="serieslist:empty", shape=box,fillcolor="white",style="filled"];
        storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];

      KickassMirrorResolver [label="KickassMirrorResolver.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        katmirrorresolverstatus [label="katmirrorresolver:status", shape=box,fillcolor="white",style="filled"];

      LocalSeriesCtrl [label="LocalSeriesCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        serieslistfilter [label="serieslist:filter", shape=box,fillcolor="white",style="filled"];

      qBittorrent [label="qBittorrent.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      SeriesListCtrl [label="SeriesListCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      SettingsTorrentCtrl [label="SettingsTorrentCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      SidepanelSerieCtrl [label="SidepanelSerieCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        serieupdating [label="serie:updating", shape=box,fillcolor="white",style="filled"];

      SyncManager [label="SyncManager.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        syncprocessremoteupdate [label="sync:processremoteupdate", shape=box,fillcolor="white",style="filled"];

      ThePirateBayMirrorResolver [label="ThePirateBayMirrorResolver.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        tpbmirrorresolverstatus [label="tpbmirrorresolver:status", shape=box,fillcolor="white",style="filled"];

      Tixati [label="Tixati.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      TorrentSearchEngines [label="TorrentSearchEngines.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        magnetselectTVDBID [label="magnet:select:{{TVDB_ID}}", shape=box,fillcolor="white",style="filled"];

      TraktTVSearchCtrl [label="TraktTVSearchCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        traktseriepreview [label="traktserie:preview", shape=box,fillcolor="white",style="filled"];

      TraktTVTrendingCtrl [label="TraktTVTrendingCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      Transmission [label="Transmission.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      uTorrent [label="uTorrent.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        torrentupdateinfoHash [label="torrent:update:{{infoHash}}", shape=box,fillcolor="white",style="filled"];

      WatchlistService [label="WatchlistService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        watchlistupdated [label="watchlist:updated", shape=box,fillcolor="white",style="filled"];
    }
```
