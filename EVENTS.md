Event Publishers And Listeners
=======================

Throughout Services and Directives in DuckieTV events are published on the $rootScope and subscribed to by others.
This keeps the configuration modular, allows easy extending at key points and prevents tight coupling


Event Descriptions
==================
------------------

 -  **$alarm:eventchannel**

    This is a dynamic event that's initiated by one of the chrome.alarms api's alarms being fired and caught by the EventWatcherService. Since a chrome alarm can just be one string and we want to initiate a dynamic action when it's been fired the EventWatcher service queries the database for a ScheduledEvent entity. Each ScheduledEvent has a channel and optional event data that will automatically be fired with $rootScope.$broadcast(ScheduledEvent.eventchannel, ScheduledEvent.eventData). This results in a delayed execution mechanism where code like this can be scheduled : favoritesservice:checkforupdates { "ID": 3, "TVDB_ID": 255326 }. These events are mainly observed in background.js to keep DuckieTV up to date without user interaction, and since v0.60 also used to schedule the episode:aired:check event that provides auto-downloads.

 -  **$locationChangeSuccess**

  	This is an angular-route internal event that will fire when the $location.hash changes.
  	It is observed by for instance the seriesList to auto-hide it when clicking a serie from your favorites list. 

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

 -  **magnet:select:{{TVDB_ID}}**(infohash:string)

    This event is fired by the TorrentDialog when a magnet uri is launched. It passes a torrent's unique 40 character hash so that it can be stored on the episode entity. The calendar and SeriesCtrl observe this event to handle persisting and triggering UI updates (like starting to watch if uTorrent is downloading this torrent by monitoring for torrent:update:{{infohash}})

 -  **mirrorresolver:status**

    A status update for the mirror resolver was published (used by SettingsCtrl to tap into verification steps)

 -  **serie:load**

    Fires when a serie has been loaded from the database

 -  **serieslist:empty**

    Fires when the series list is empty. Hooked by the seriesList directive to make it automatically pop up the suggestions when database is empty

 -  **serieslist:hide**

    Notify the series list that it should hide itself. Fired on navigation change so that it doesn't stay in view

 -  **setDate**

    Notify that the calendar's date has changed. Fired by the calendar internals and observed by the CalendarEvents provider that fetches and serves the calendar events for the date range currently in view

 -  **storage:update**

    Notify the SettingsSync service that something has changed in the favorite series list.

 -  **timer:created**

    Notify the TimerCtrl that a timer has been created and it should refresh

 -  **timer:fired**

    Notify the TimerCtrl that a timer has fired

 -  **torrent:update:**{{infoHash}}

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
![listeners](https://cloud.githubusercontent.com/assets/6933240/3555821/d93932ce-091b-11e4-9ceb-940d5146b3f9.png)

Event Publishers:
------------------
![publishers](https://cloud.githubusercontent.com/assets/6933240/3555837/f6ea1900-091b-11e4-81af-bb713a4cc634.png)

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

      Listeners -> something [style="invis"];
      Listeners -> app [style="invis"];
      Listeners -> backgroundRotator [style="invis"];
      Listeners -> calendar [style="invis"];
      Listeners -> ChromeCast [style="invis"];
      Listeners -> datePicker [style="invis"];
      Listeners -> DuckieTorrent [style="invis"];
      Listeners -> EpisodeAiredService [style="invis"];
      Listeners -> EpisodeCtrl [style="invis"];
      Listeners -> FavoritesService [style="invis"];
      Listeners -> SerieCtrl [style="invis"];
      Listeners -> seriesList [style="invis"];
      Listeners -> SettingsCtrl [style="invis"];
      Listeners -> TimerCtrl [style="invis"];
      Listeners -> WatchlistCtrl [style="invis"];
      Listeners -> WatchlistCheckerService [style="invis"];

      backgroundload -> backgroundRotator;
      backgroundload -> ChromeCast;
      calendarclearcache -> calendar;
      calendarevents -> datePicker;
      calendarupdate -> something;
      episodeairedcheck -> EpisodeAiredService;
      episodeload -> ChromeCast;
      episodemarkednotwatched -> app;
      episodemarkednotwatched -> calendar;
      episodemarkedwatched -> app;
      episodemarkedwatched -> calendar;
      episodesinserted -> seriesList;
      episodesupdated -> calendar;
      episodesupdated -> SerieCtrl;
      favoritesservicecheckforupdates -> FavoritesService;
      favoritesupdated -> SerieCtrl;
      favoritesupdated -> seriesList;
      favoritesupdated -> SettingsCtrl;
      locationChangeSuccess -> app;
      magnetselectTVDBID -> calendar;
      magnetselectTVDBID -> EpisodeCtrl;
      magnetselectTVDBID -> SerieCtrl;
      mirrorresolverstatus -> SettingsCtrl;
      serieload -> ChromeCast;
      serieslistempty -> seriesList;
      serieslisthide -> seriesList;
      setDate -> calendar;
      storageupdate -> app;
      timercreated -> TimerCtrl;
      timerfired -> TimerCtrl;
      torrentupdateinfoHash -> DuckieTorrent;
      videoload -> ChromeCast;
      watchlistcheck -> WatchlistCheckerService;
      watchlistupdated -> WatchlistCtrl;

      Listeners [style="invis"];

      something [label="something.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        calendarupdate [label="calendar:update", shape=box,fillcolor="white",style="filled"];

      app [label="app.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];
        locationChangeSuccess [label="$locationChangeSuccess", shape=box,fillcolor="white",style="filled"];
        episodemarkedwatched [label="episode:marked:watched", shape=box,fillcolor="white",style="filled"];
        episodemarkednotwatched [label="episode:marked:notwatched", shape=box,fillcolor="white",style="filled"];

      backgroundRotator [ label="backgroundRotator.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];

      calendar [ label="calendar.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        episodesupdated [label="episodes:updated", shape=box,fillcolor="white",style="filled"];
        calendarclearcache [label="calendar:clearcache", shape=box,fillcolor="white",style="filled"];
        setDate [label="setDate", shape=box,fillcolor="white",style="filled"];

      ChromeCast [ label="ChromeCast.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        serieload [label="serie:load", shape=box,fillcolor="white",style="filled"];
        episodeload [label="episode:load", shape=box,fillcolor="white",style="filled"];
        videoload [label=" video:load", shape=box,fillcolor="white",style="filled"];

      datePicker [ label="datePicker.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        calendarevents [label="calendar:events", shape=box,fillcolor="white",style="filled"];

      DuckieTorrent [ label="DuckieTorrent.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        torrentupdateinfoHash [label="torrent:update:{{infoHash}}", shape=box,fillcolor="white",style="filled"];

      EpisodeAiredService [ label="EpisodeAiredService.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        episodeairedcheck [label="episode:aired:check", shape=box,fillcolor="white",style="filled"];

      EpisodeCtrl [ label="EpisodeCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];

      FavoritesService [ label="FavoritesService.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        favoritesservicecheckforupdates [label="favoritesservice:checkforupdates", shape=box,fillcolor="white",style="filled"];

      SerieCtrl [ label="SerieCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        magnetselectTVDBID [label="magnet:select:{{TVDB_ID}}", shape=box,fillcolor="white",style="filled"];

      seriesList [ label="seriesList.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        serieslisthide [label="serieslist:hide", shape=box,fillcolor="white",style="filled"];
        favoritesupdated [label="favorites:updated", shape=box,fillcolor="white",style="filled"];
        episodesinserted [label="episodes:inserted", shape=box,fillcolor="white",style="filled"];
        serieslistempty [label="serieslist:empty", shape=box,fillcolor="white",style="filled"];

      SettingsCtrl [ label="SettingsCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        mirrorresolverstatus [label="mirrorresolver:status", shape=box,fillcolor="white",style="filled"];

      TimerCtrl [ label="TimerCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        timercreated [label="timer:created", shape=box,fillcolor="white",style="filled"];
        timerfired [label="timer:fired", shape=box,fillcolor="white",style="filled"];

      WatchlistCtrl [ label="WatchlistCtrl.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        watchlistupdated [label="watchlist:updated", shape=box,fillcolor="white",style="filled"];

      WatchlistCheckerService [ label="WatchlistCheckerService.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        watchlistcheck [label="watchlist:check", shape=box,fillcolor="white",style="filled"];
    }



Publishers
-------------


    digraph g {
      splines=true;
      sep="+5,+5";
      overlap="scalexy";
      nodesep=0.2;
      node [fontsize=11];

      Publishers -> something [style="invis"];
      Publishers -> angularjs [style="invis"];
      Publishers -> app [style="invis"];
      Publishers -> BackupCtrl [style="invis"];
      Publishers -> calendar [style="invis"];
      Publishers -> CRUDentities [style="invis"];
      Publishers -> datePicker [style="invis"];
      Publishers -> DuckieTorrent [style="invis"];
      Publishers -> EpisodeAiredService [style="invis"];
      Publishers -> EpisodeCtrl [style="invis"];
      Publishers -> EventSchedulerService [style="invis"];
      Publishers -> EventWatcherService [style="invis"];
      Publishers -> FavoritesService [style="invis"];
      Publishers -> FileReader [style="invis"];
      Publishers -> MirrorResolver [style="invis"];
      Publishers -> SerieCtrl [style="invis"];
      Publishers -> seriesList [style="invis"];
      Publishers -> SettingsCtrl [style="invis"];
      Publishers -> TorrentCtrl [style="invis"];
      Publishers -> torrentDialog [style="invis"];
      Publishers -> WatchlistService [style="invis"];

      alarmeventchannel -> EventWatcherService [dir="back"];
      backgroundload -> EpisodeCtrl [dir="back"];
      backgroundload -> FavoritesService [dir="back"];
      backgroundload -> SerieCtrl [dir="back"];
      backgroundload -> seriesList [dir="back"] ;
      backgroundload -> SettingsCtrl [dir="back"];
      calendarclearcache -> FavoritesService [dir="back"];
      calendarclearcache -> SerieCtrl [dir="back"];
      calendarevents -> calendar [dir="back"];
      calendarupdate -> BackupCtrl [dir="back"];
      episodeairedcheck -> EventWatcherService [dir="back"];
      episodeload -> EpisodeCtrl [dir="back"];
      episodesinserted -> something [dir="back"];
      episodemarkednotwatched -> CRUDentities [dir="back"];
      episodemarkedwatched -> CRUDentities [dir="back"];
      episodesupdated -> EpisodeAiredService [dir="back"];
      episodesupdated -> FavoritesService [dir="back"];
      favoritesupdated -> FavoritesService [dir="back"];
      favoritesservicecheckforupdates -> EventWatcherService [dir="back"];
      locationChangeSuccess -> angularjs [dir="back"];
      magnetselectTVDBID -> torrentDialog [dir="back"];
      mirrorresolverstatus -> MirrorResolver [dir="back"];
      mirrorresolverstatus -> SettingsCtrl [dir="back"];
      serieload -> EpisodeCtrl [dir="back"];
      serieload -> SerieCtrl [dir="back"];
      serieslistempty -> seriesList [dir="back"];
      serieslisthide -> app [dir="back"];
      setDate -> datePicker [dir="back"];
      storageupdate -> BackupCtrl [dir="back"];
      storageupdate -> seriesList [dir="back"];
      storageupdate -> SettingsCtrl [dir="back"];
      timercreated -> EventSchedulerService [dir="back"];
      timerfired -> EventWatcherService [dir="back"];
      torrentupdateinfoHash -> DuckieTorrent [dir="back"];
      videoload -> DuckieTorrent [dir="back"];
      videoload -> TorrentCtrl [dir="back"];
      watchlistupdated -> WatchlistService [dir="back"];

      Publishers [style="invis"];

      something [label="something.js", shape=box,fillcolor="#efefef",color="white",style="filled"];
        episodesinserted [label="episodes:inserted", shape=box,fillcolor="white",style="filled"];

      angularjs [label="angular.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        locationChangeSuccess [label="$locationChangeSuccess", shape=box,fillcolor="white",style="filled"];

      app [label="app.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        serieslisthide [label="serieslist:hide", shape=box,fillcolor="white",style="filled"];

      BackupCtrl [label="BackupCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];
        calendarupdate [label="calendar:update", shape=box,fillcolor="white",style="filled"];

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
        episodesupdated [label="episodes:updated", shape=box,fillcolor="white",style="filled"];

      EpisodeCtrl [label="EpisodeCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        serieload [label="serie:load", shape=box,fillcolor="white",style="filled"];
        episodeload [label="episode:load", shape=box,fillcolor="white",style="filled"];
        backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];

      EventSchedulerService [label="EventSchedulerService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        timercreated [label="timer:created", shape=box,fillcolor="white",style="filled"];

      EventWatcherService [label="EventWatcherService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        alarmeventchannel [label="$alarm:eventchannel", shape=box,fillcolor="white",style="filled"];
        episodeairedcheck [label="episode:aired:check", shape=box,fillcolor="white",style="filled"];
        favoritesservicecheckforupdates [label="favoritesservice:checkforupdates", shape=box,fillcolor="white",style="filled"];
        timerfired [label="timer:fired", shape=box,fillcolor="white",style="filled"];

      FavoritesService [label="FavoritesService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        calendarclearcache [label="calendar:clearcache", shape=box,fillcolor="white",style="filled"];
        favoritesupdated [label="favorites:updated", shape=box,fillcolor="white",style="filled"];

      MirrorResolver [label="MirrorResolver.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        mirrorresolverstatus [label="mirrorresolver:status", shape=box,fillcolor="white",style="filled"];

      SerieCtrl [label="SerieCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      seriesList [label="seriesList.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        serieslistempty [label="serieslist:empty", shape=box,fillcolor="white",style="filled"];

      SettingsCtrl [label="SettingsCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      TorrentCtrl [label="TorrentCtrl.js",shape=box,color="white",fillcolor="#efefef",style="filled"];

      torrentDialog [label="torrentDialog.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        magnetselectTVDBID [label="magnet:select:{{TVDB_ID}}", shape=box,fillcolor="white",style="filled"];

      WatchlistService [label="WatchlistService.js",shape=box,color="white",fillcolor="#efefef",style="filled"];
        watchlistupdated [label="watchlist:updated", shape=box,fillcolor="white",style="filled"];

    }

