Event Publishers And Listeners
=======================

Throughout Services and Directives in DuckieTV events are published on the $rootScope and subscribed to by others.
This keeps the configuration modular, allows easy extending at key points and prevents tight coupling


Event Descriptions
==================
------------------

 -  **background:load**

    Tells the BackgroundRotator service to load a new background image. 
    The background rotator handles queueing and switching between them.

 -  **calendar:clearcache**

    Tells the calendar to clear it's cache and redraw

 -  **calendar:events**

    Feed the calendar new events

 -  **calendar:update**

    Refresh the calendar
 
 -  **episode:aired:check**
 
    Fires when the EpisodeAiredService needs to be triggered. This event is fired from the EventSchedulerService that gets instantiated by chrome's alarm API
 
 -  **episode:load**
 
    An episode has been loaded.
 
 -  **episode:marked:notwatched**
 
    An episode has been marked as not watched. Observed by Trakt.TV and forwards the markaswatched call when it's configured.
 
 -  **episode:marked:watched**
 
    An episode has been marked as not watched. Observed by Trakt.TV and forwards the markaswatched call when it's configured.
 
 -  **episodes:inserted**
 
    Fires when new episodes have been inserted into the database.
 
 -  **episodes:updated**
 
    Fires when episodes have been updated from trakt.tv
 
 -  **favorites:updated**
 
    Fires when a new favorite tv show has been inserted or removed
 
 -  **favoritesservice:checkforupdates**({TVDB_ID: int})

    Notifies the favorites service that it needs to re-add the whole show based on the TVDB_ID
 
 -  **mirrorresolver:status**

    A status update for the mirror resolver was published (used by SettingsCtrl to tap into verification steps)
 
 -  **serie:load**

    Fires when a serie has been loaded from the database
 
 -  **serieslist:empty**
 
    Fires when the series list is empty. Hooked by the seriesList directive to make it automatically pop up the suggestions when database is empty

 -  **serieslist:hide**

    Notify the series list that it should hide itself. Fired on navigation change so that it doesn't stay in view
 
 -  **storage:update**

    Notify the SettingsSync service that something has changed in the favorite series list.
 
 -  **timer:created**

    Notify the TimerCtrl that a timer has been created and it should refresh
 
 -  **timer:fired**

    Notify the TimerCtrl that a timer has fired
 
 -  **torrent:update:{{infoHash}}**

    Notify the torrentRemoteControl directives that a torrent's data has been updated.
 
 -  **video:load**

    Notify ChromeCast to load a video
 
 -  **watchlist:check**

    Fires when the watchlist should be checked for updates
 
 -  **watchlist:updated**

    Fires when the watchlist is updated



Graphviz graphs
===============


Event Listeners:
-----------------------
  ![image](https://cloud.githubusercontent.com/assets/111710/3501720/9c060756-0619-11e4-9d77-d0fd86563baf.png)
Event Publishers:
------------------
 ![image](https://cloud.githubusercontent.com/assets/111710/3501714/80dc6844-0619-11e4-9b69-b4414d612efc.png)


You can visualize these graphs online at http://graphviz-dev.appspot.com/ 

For the best results, select the twopi layout engine for both graphs

Listeners
-------------


   digraph g {
      splines=true;
      sep="+5,+5";
      overlap=scalexy;
      nodesep=0.2;
      node [fontsize=11];
    
      Listeners -> app [style="invis"]
      Listeners -> backgroundRotator  [style="invis"]
      Listeners -> calendar  [style="invis"]
      Listeners -> ChromeCast  [style="invis"]
      Listeners -> DuckieTorrent  [style="invis"]
      Listeners -> FavoritesService  [style="invis"]
      Listeners -> seriesList  [style="invis"]
      Listeners -> SettingsCtrl  [style="invis"]
      Listeners -> TimerCtrl  [style="invis"]
      Listeners -> WatchlistCheckerService  [style="invis"]
    
      episodemarkednotwatched -> app
      episodemarkedwatched -> app
      episodemarkedwatched -> TraktTV
      episodemarkednotwatched -> TraktTV
      locationChangeSuccess -> app
      storageupdate -> app
      backgroundload -> backgroundRotator
      calendarclearcache -> calendar
      episodesupdated -> calendar
      setDate -> calendar
      episodeload -> ChromeCast
      serieload -> ChromeCast
      videoload -> ChromeCast
      backgroundload -> ChromeCast
      episodeairedcheck -> DuckieTorrent
      torrentupdateinfoHash -> DuckieTorrent
      favoritesservicecheckforupdates -> FavoritesService
      serieslisthide -> locationChangeSuccess
      episodesinserted -> seriesList
      favoritesupdated -> seriesList
      serieslisthide -> seriesList
      serieslistempty -> seriesList
      mirrorresolverstatus -> SettingsCtrl
      timerfired -> TimerCtrl
      timercreated -> TimerCtrl
      watchlistcheck -> WatchlistCheckerService
    
      Listeners [style="invis"];
    
      app [label="app.js", shape=box,fillcolor="white",style="filled"];
        storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];
        locationChangeSuccess [label="$locationChangeSuccess", shape=box,fillcolor="white",style="filled"];
        episodemarkedwatched [label="episode:marked:watched", shape=box,fillcolor="white",style="filled"];
        episodemarkednotwatched [label="episode:marked:notwatched", shape=box,fillcolor="white",style="filled"];
    
      TraktTV [ label="TraktTV", shape=box,fillcolor="#efefef",color="white",style="filled"];
        mirrorresolverstatus [label="mirrorresolver:status", shape=box,fillcolor="white",style="filled"];
    
      SettingsCtrl [ label="SettingsCtrl", shape=box,fillcolor="#efefef",color="white",style="filled"];
        mirrorresolverstatus [label="mirrorresolver:status", shape=box,fillcolor="white",style="filled"];
    
      TimerCtrl [ label="TimerCtrl", shape=box,fillcolor="#efefef",color="white",style="filled"];
        timercreated [label="timer:created", shape=box,fillcolor="white",style="filled"];
        timerfired [label="timer:fired", shape=box,fillcolor="white",style="filled"];
    
      backgroundRotator [ label="backgroundRotator", shape=box,fillcolor="#efefef",color="white",style="filled"];
        backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];
    
      calendar [ label="calendar", shape=box,fillcolor="#efefef",color="white",style="filled"];
        episodesupdated [label="episodes:updated", shape=box,fillcolor="white",style="filled"];
        calendarclearcache [label="calendar:clearcache", shape=box,fillcolor="white",style="filled"];
        setDate [label="setDate", shape=box,fillcolor="white",style="filled"];
     
      seriesList [ label="seriesList", shape=box,fillcolor="#efefef",color="white",style="filled"];
        serieslisthide [label="serieslist:hide", shape=box,fillcolor="white",style="filled"];
        favoritesupdated [label="favorites:updated", shape=box,fillcolor="white",style="filled"];
        episodesinserted [label="episodes:inserted", shape=box,fillcolor="white",style="filled"];
        serieslistempty [label="serieslist:empty", shape=box,fillcolor="white",style="filled"];
     
      ChromeCast [ label="ChromeCast", shape=box,fillcolor="#efefef",color="white",style="filled"];
        serieload [label="serie:load", shape=box,fillcolor="white",style="filled"];
        episodeload [label="episode:load", shape=box,fillcolor="white",style="filled"];
        videoload [label=" background:load", shape=box,fillcolor="white",style="filled"];
     
      DuckieTorrent [ label="DuckieTorrent", shape=box,fillcolor="#efefef",color="white",style="filled"];
        torrentupdateinfoHash [label="torrent:update:{{infoHash}}", shape=box,fillcolor="white",style="filled"];
        episodeairedcheck [label="episode:aired:check", shape=box,fillcolor="white",style="filled"];
       
      FavoritesService [ label="FavoritesService", shape=box,fillcolor="#efefef",color="white",style="filled"];
        favoritesservicecheckforupdates [label="favoritesservice:checkforupdates", shape=box,fillcolor="white",style="filled"];
     
      WatchlistCheckerService [ label="WatchlistCheckerService", shape=box,fillcolor="#efefef",color="white",style="filled"];
        watchlistcheck [label="watchlist:check", shape=box,fillcolor="white",style="filled"];
    }




Publishers


   digraph g {
      splines=true;
      sep="+5,+5";
      overlap="scalexy";
      nodesep=0.2;
      node [fontsize=11];
    
      Publishers -> app  [style="invis"]
      Publishers -> BackupCtrl  [style="invis"]
      Publishers -> DuckieTorrent  [style="invis"]
      Publishers -> Episode  [style="invis"]
      Publishers -> EpisodeAiredService  [style="invis"]
      Publishers -> EpisodeCtrl  [style="invis"]
      Publishers -> EventSchedulerService  [style="invis"]
      Publishers -> EventWatcherService  [style="invis"]
      Publishers -> FavoritesService  [style="invis"]
      Publishers -> FileReader  [style="invis"]
      Publishers -> MirrorResolver  [style="invis"]
      Publishers -> ScheduledEvents  [style="invis"]
      Publishers -> SerieCtrl  [style="invis"]
      Publishers -> seriesList  [style="invis"]
      Publishers -> SettingsCtrl  [style="invis"]
      Publishers -> TorrentCtrl  [style="invis"]
      Publishers -> torrentDialog  [style="invis"]
      Publishers -> WatchlistService  [style="invis"]
    
       CRUDentities -> app [dir="back"]
       serieslisthide -> app  [dir="back"]
       calendarupdate -> BackupCtrl  [dir="back"]
       storageupdate -> BackupCtrl  [dir="back"]
       Episode -> CRUDEntities  [dir="back"]
       torrentupdatemagnetHash -> DuckieTorrent  [dir="back"]
       videoload -> DuckieTorrent  [dir="back"]
       episodemarkednotwatched -> Episode  [dir="back"]
       episodemarkedwatched -> Episode  [dir="back"]
       episodesupdated -> EpisodeAiredService  [dir="back"]
       backgroundload -> EpisodeCtrl  [dir="back"]
       episodeload -> EpisodeCtrl  [dir="back"]
       serieload -> EpisodeCtrl  [dir="back"]
       timercreated -> EventSchedulerService  [dir="back"]
       alarmeventchannel -> EventWatcherService  [dir="back"]
       backgroundload -> FavoritesService  [dir="back"]
       calendarclearcache -> FavoritesService  [dir="back"] 
       episodesupdated -> FavoritesService  [dir="back"]
       favoritesupdated -> FavoritesService  [dir="back"]
       fileProgress -> FileReader  [dir="back"]
       mirrorresolverstatus -> MirrorResolver  [dir="back"]
       episodeairedcheck -> ScheduledEvents  [dir="back"]
       backgroundload -> SerieCtrl  [dir="back"]
       serieload -> SerieCtrl  [dir="back"]
       calendarclearcache -> SerieCtrl [dir="back"] 
       backgroundload -> seriesList [dir="back"] 
       episodesinserted -> seriesList [dir="back"] 
       serieslistempty -> seriesList  [dir="back"]
       storageupdate -> seriesList [dir="back"]
       backgroundload -> SettingsCtrl  [dir="back"]
       favoritesupdated -> SettingsCtrl  [dir="back"]
       mirrorresolverstatus -> SettingsCtrl  [dir="back"]
       storageupdate -> SettingsCtrl  [dir="back"]
       calendar -> TorrentCtrl  [dir="back"]
       calendarevents -> TorrentCtrl  [dir="back"]
       videoload -> TorrentCtrl  [dir="back"]
       magnetselectTVDBID -> torrentDialog  [dir="back"]
       watchlistupdated -> WatchlistService  [dir="back"]
    
      Publishers [style="invis"];
      
      app [label="app",shape=box,color="white",fillcolor="#efefef",style="filled"];
      serieslisthide [label="serieslist:hide", shape=box,fillcolor="white",style="filled"];
    
      CRUDentities [label="CRUD.entities",shape=box,color="white",fillcolor="#efefef",style="filled"];
      Episode [label="Episode", shape=box,fillcolor="white",style="filled"];
      episodemarkedwatched [label="episode:marked:watched",shape=box,fillcolor="white",style="filled"];
      episodemarkednotwatched [label="episode:marked:notwatched", shape=box,fillcolor="white",style="filled"];
    
      ScheduledEvents [label="ScheduledEvents",shape=box,color="white",fillcolor="#efefef",style="filled"];
      episodeairedcheck [label="episode:aired:check", shape=box,fillcolor="white",style="filled"];
    
      BackupCtrl [label="BackupCtrl",shape=box,color="white",fillcolor="#efefef",style="filled"];
      storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];
      calendarupdate [label="calendar:update", shape=box,fillcolor="white",style="filled"];
    
      EpisodeCtrl [label="EpisodeCtrl",shape=box,color="white",fillcolor="#efefef",style="filled"];
      serieload [label="serie:load", shape=box,fillcolor="white",style="filled"];
      episodeload [label="episode:load", shape=box,fillcolor="white",style="filled"];
      backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];
    
      SerieCtrl [label="SerieCtrl",shape=box,color="white",fillcolor="#efefef",style="filled"];
      serieload [label="serie:load", shape=box,fillcolor="white",style="filled"];
      backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];
      calendarclearcache [label="calendar:clearcache", shape=box,fillcolor="white",style="filled"];
    
      SettingsCtrl [label="SettingsCtrl",shape=box,color="white",fillcolor="#efefef",style="filled"];
      storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];
      mirrorresolverstatus [label="mirrorresolver:status", shape=box,fillcolor="white",style="filled"];
      favoritesupdated [label="favorites:updated", shape=box,fillcolor="white",style="filled"];
      backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];
    
      TorrentCtrl [label="TorrentCtrl",shape=box,color="white",fillcolor="#efefef",style="filled"];
      videoload [label="video:load", shape=box,fillcolor="white",style="filled"];
    
      calendar [label="calendar",shape=box,color="white",fillcolor="#efefef",style="filled"];
      calendarevents [label="calendar:events", shape=box,fillcolor="white",style="filled"];
    
      seriesList [label="seriesList",shape=box,color="white",fillcolor="#efefef",style="filled"];
      storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];
      serieslistempty [label="serieslist:empty", shape=box,fillcolor="white",style="filled"];
      episodesinserted [label="episodes:inserted", shape=box,fillcolor="white",style="filled"];
      backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];
    
      torrentDialog [label="torrentDialog",shape=box,color="white",fillcolor="#efefef",style="filled"];
      magnetselectTVDBID [label="magnet:select:{{TVDB_ID}}", shape=box,fillcolor="white",style="filled"];
    
      DuckieTorrent [label="DuckieTorrent",shape=box,color="white",fillcolor="#efefef",style="filled"];
      torrentupdatemagnetHash [label="torrent:update:{{magnetHash}}", shape=box,fillcolor="white",style="filled"];
      videoload [label="video:load", shape=box,fillcolor="white",style="filled"];
    
      EpisodeAiredService [label="EpisodeAiredService",shape=box,color="white",fillcolor="#efefef",style="filled"];
      episodesupdated [label="episodes:updated", shape=box,fillcolor="white",style="filled"];
    
      EventSchedulerService [label="EventSchedulerService",shape=box,color="white",fillcolor="#efefef",style="filled"];
      timercreated [label="timer:created", shape=box,fillcolor="white",style="filled"];
    
      EventWatcherService [label="EventWatcherService",shape=box,color="white",fillcolor="#efefef",style="filled"];
      alarmeventchannel [label="$alarm:eventchannel", shape=box,fillcolor="white",style="filled"];
    
      FavoritesService [label="FavoritesService",shape=box,color="white",fillcolor="#efefef",style="filled"];
      backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];
      episodesupdated [label="episodes:updated", shape=box,fillcolor="white",style="filled"];
      calendarclearcache [label="calendar:clearcache", shape=box,fillcolor="white",style="filled"];
      favoritesupdated [label="favorites:updated", shape=box,fillcolor="white",style="filled"];
    
      FileReader [label="FileReader",shape=box,color="white",fillcolor="#efefef",style="filled"];
      fileProgress [label="fileProgress", shape=box,fillcolor="white",style="filled"];
    
      MirrorResolver [label="MirrorResolver",shape=box,color="white",fillcolor="#efefef",style="filled"];
      mirrorresolverstatus [label="mirrorresolver:status", shape=box,fillcolor="white",style="filled"];
    
      WatchlistService [label="WatchlistService",shape=box,color="white",fillcolor="#efefef",style="filled"];
      watchlistupdated [label="watchlist:updated", shape=box,fillcolor="white",style="filled"];
    
      }

