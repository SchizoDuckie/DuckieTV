Event Listeners and Publishers
===============================

You can find the hosted versions of this graph here:
Event Listeners:  https://cloud.githubusercontent.com/assets/111710/3501720/9c060756-0619-11e4-9d77-d0fd86563baf.png
Publishers: https://cloud.githubusercontent.com/assets/111710/3501714/80dc6844-0619-11e4-9b69-b4414d612efc.png


paste this into http://graphviz-dev.appspot.com/ and select the neato engine


Event listeners
===============
``

digraph g {
  splines=true;
  sep="+5,+5";
  overlap=scalexy;
  nodesep=0.2;
  node [fontsize=11];

  Listeners -> app
  Listeners -> backgroundRotator
  Listeners -> calendar
  Listeners -> ChromeCast
  Listeners -> DuckieTorrent
  Listeners -> FavoritesService
  Listeners -> seriesList
  Listeners -> SettingsCtrl
  Listeners -> TimerCtrl
  Listeners -> WatchlistCheckerService

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

  Listeners [label="Event Listeners", shape=box,fillcolor="black",fontcolor="white",style="filled"];

  app [label="app.js", shape=box,fillcolor="white",style="filled"];
    storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];
    locationChangeSuccess [label="$locationChangeSuccess", shape=box,fillcolor="white",style="filled"];
    episodemarkedwatched [label="episode:marked:watched", shape=box,fillcolor="white",style="filled"];
    episodemarkednotwatched [label="episode:marked:notwatched", shape=box,fillcolor="white",style="filled"];

  TraktTV [ label="TraktTV", shape=box,fillcolor="#efefef",color="white",style="filled"]
    mirrorresolverstatus [label="mirrorresolver:status", shape=box,fillcolor="white",style="filled"];

  SettingsCtrl [ label="SettingsCtrl", shape=box,fillcolor="#efefef",color="white",style="filled"]
    mirrorresolverstatus [label="mirrorresolver:status", shape=box,fillcolor="white",style="filled"];

  TimerCtrl [ label="TimerCtrl", shape=box,fillcolor="#efefef",color="white",style="filled"]
    timercreated [label="timer:created", shape=box,fillcolor="white",style="filled"];
    timerfired [label="timer:fired", shape=box,fillcolor="white",style="filled"];

  backgroundRotator [ label="backgroundRotator", shape=box,fillcolor="#efefef",color="white",style="filled"]
    backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];

  calendar [ label="calendar", shape=box,fillcolor="#efefef",color="white",style="filled"]
    episodesupdated [label="episodes:updated", shape=box,fillcolor="white",style="filled"];
    calendarclearcache [label="calendar:clearcache", shape=box,fillcolor="white",style="filled"];
    setDate [label="setDate", shape=box,fillcolor="white",style="filled"];
 
  seriesList [ label="seriesList", shape=box,fillcolor="#efefef",color="white",style="filled"]
    serieslisthide [label="serieslist:hide", shape=box,fillcolor="white",style="filled"];
    favoritesupdated [label="favorites:updated", shape=box,fillcolor="white",style="filled"];
    episodesinserted [label="episodes:inserted", shape=box,fillcolor="white",style="filled"];
    serieslistempty [label="serieslist:empty", shape=box,fillcolor="white",style="filled"];
 
  ChromeCast [ label="ChromeCast", shape=box,fillcolor="#efefef",color="white",style="filled"]
    serieload [label="serie:load", shape=box,fillcolor="white",style="filled"];
    episodeload [label="episode:load", shape=box,fillcolor="white",style="filled"];
    videoload [label=" background:load", shape=box,fillcolor="white",style="filled"];
 
  DuckieTorrent [ label="DuckieTorrent", shape=box,fillcolor="#efefef",color="white",style="filled"]
    torrentupdateinfoHash [label="torrent:update:{{infoHash}}", shape=box,fillcolor="white",style="filled"];
    episodeairedcheck [label="episode:aired:check", shape=box,fillcolor="white",style="filled"];
   
  FavoritesService [ label="FavoritesService", shape=box,fillcolor="#efefef",color="white",style="filled"]
    favoritesservicecheckforupdates [label="favoritesservice:checkforupdates", shape=box,fillcolor="white",style="filled"];
 
  WatchlistCheckerService [ label="WatchlistCheckerService", shape=box,fillcolor="#efefef",color="white",style="filled"]
    watchlistcheck [label="watchlist:check", shape=box,fillcolor="white",style="filled"];
}


``


Event Publishers
================

Set the layout for the publishers graph to 'twopi'

`` 
digraph g {
  splines=true;
  sep="+5,+5";
  overlap="scalexy";
  nodesep=0.2;
  node [fontsize=11];

  Publishers -> app
  Publishers -> BackupCtrl
  Publishers -> DuckieTorrent
  Publishers -> Episode
  Publishers -> EpisodeAiredService
  Publishers -> EpisodeCtrl
  Publishers -> EventSchedulerService
  Publishers -> EventWatcherService
  Publishers -> FavoritesService
  Publishers -> FileReader
  Publishers -> MirrorResolver
  Publishers -> ScheduledEvents
  Publishers -> SerieCtrl
  Publishers -> seriesList
  Publishers -> SettingsCtrl
  Publishers -> TorrentCtrl
  Publishers -> torrentDialog
  Publishers -> WatchlistService

   CRUDentities -> app
   serieslisthide -> app
   calendarupdate -> BackupCtrl
   storageupdate -> BackupCtrl
   Episode -> CRUDEntities
   torrentupdatemagnetHash -> DuckieTorrent
   videoload -> DuckieTorrent
   episodemarkednotwatched -> Episode
   episodemarkedwatched -> Episode
   episodesupdated -> EpisodeAiredService
   backgroundload -> EpisodeCtrl
   episodeload -> EpisodeCtrl
   serieload -> EpisodeCtrl
   timercreated -> EventSchedulerService
   alarmeventchannel -> EventWatcherService
   backgroundload -> FavoritesService
   calendarclearcache -> FavoritesService
   episodesupdated -> FavoritesService
   favoritesupdated -> FavoritesService
   fileProgress -> FileReader
   mirrorresolverstatus -> MirrorResolver
   episodeairedcheck -> ScheduledEvents
   backgroundload -> SerieCtrl
   serieload -> SerieCtrl
   calendarclearcache -> SerieCtrl
   backgroundload -> seriesList
   episodesinserted -> seriesList
   serieslistempty -> seriesList
   storageupdate -> seriesList
   backgroundload -> SettingsCtrl
   favoritesupdated -> SettingsCtrl
   mirrorresolverstatus -> SettingsCtrl
   storageupdate -> SettingsCtrl
   calendar -> TorrentCtrl
   calendarevents -> TorrentCtrl
   videoload -> TorrentCtrl
   magnetselectTVDBID -> torrentDialog
   watchlistupdated -> WatchlistService

  Publishers [label="Publishers",shape=box,fillcolor="black",fontcolor="white",style="filled"];
  
  app [label="app",shape=box,fillcolor="#efefef",style="filled"];
  serieslisthide [label="serieslist:hide", shape=box,fillcolor="white",style="filled"];

  CRUDentities [label="CRUD.entities",shape=box,fillcolor="#efefef",style="filled"];
  Episode [label="Episode", shape=box,fillcolor="white",style="filled"];
  episodemarkedwatched [label="episode:marked:watched",shape=box,fillcolor="white",style="filled"];
  episodemarkednotwatched [label="episode:marked:notwatched", shape=box,fillcolor="white",style="filled"];

  ScheduledEvents [label="ScheduledEvents",shape=box,fillcolor="#efefef",style="filled"];
  episodeairedcheck [label="episode:aired:check", shape=box,fillcolor="white",style="filled"];

  BackupCtrl [label="BackupCtrl",shape=box,fillcolor="#efefef",style="filled"];
  storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];
  calendarupdate [label="calendar:update", shape=box,fillcolor="white",style="filled"];

  EpisodeCtrl [label="EpisodeCtrl",shape=box,fillcolor="#efefef",style="filled"];
  serieload [label="serie:load", shape=box,fillcolor="white",style="filled"];
  episodeload [label="episode:load", shape=box,fillcolor="white",style="filled"];
  backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];

  SerieCtrl [label="SerieCtrl",shape=box,fillcolor="#efefef",style="filled"];
  serieload [label="serie:load", shape=box,fillcolor="white",style="filled"];
  backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];
  calendarclearcache [label="calendar:clearcache", shape=box,fillcolor="white",style="filled"];

  SettingsCtrl [label="SettingsCtrl",shape=box,fillcolor="#efefef",style="filled"];
  storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];
  mirrorresolverstatus [label="mirrorresolver:status", shape=box,fillcolor="white",style="filled"];
  favoritesupdated [label="favorites:updated", shape=box,fillcolor="white",style="filled"];
  backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];

  TorrentCtrl [label="TorrentCtrl",shape=box,fillcolor="#efefef",style="filled"];
  videoload [label="video:load", shape=box,fillcolor="white",style="filled"];

  calendar [label="calendar",shape=box,fillcolor="#efefef",style="filled"];
  calendarevents [label="calendar:events", shape=box,fillcolor="white",style="filled"];

  seriesList [label="seriesList",shape=box,fillcolor="#efefef",style="filled"];
  storageupdate [label="storage:update", shape=box,fillcolor="white",style="filled"];
  serieslistempty [label="serieslist:empty", shape=box,fillcolor="white",style="filled"];
  episodesinserted [label="episodes:inserted", shape=box,fillcolor="white",style="filled"];
  backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];

  torrentDialog [label="torrentDialog",shape=box,fillcolor="#efefef",style="filled"];
  magnetselectTVDBID [label="magnet:select:{{TVDB_ID}}", shape=box,fillcolor="white",style="filled"];

  DuckieTorrent [label="DuckieTorrent",shape=box,fillcolor="#efefef",style="filled"];
  torrentupdatemagnetHash [label="torrent:update:{{magnetHash}}", shape=box,fillcolor="white",style="filled"];
  videoload [label="video:load", shape=box,fillcolor="white",style="filled"];

  EpisodeAiredService [label="EpisodeAiredService",shape=box,fillcolor="#efefef",style="filled"];
  episodesupdated [label="episodes:updated", shape=box,fillcolor="white",style="filled"];

  EventSchedulerService [label="EventSchedulerService",shape=box,fillcolor="#efefef",style="filled"];
  timercreated [label="timer:created", shape=box,fillcolor="white",style="filled"];

  EventWatcherService [label="EventWatcherService",shape=box,fillcolor="#efefef",style="filled"];
  alarmeventchannel [label="$alarm:eventchannel", shape=box,fillcolor="white",style="filled"];

  FavoritesService [label="FavoritesService",shape=box,fillcolor="#efefef",style="filled"];
  backgroundload [label="background:load", shape=box,fillcolor="white",style="filled"];
  episodesupdated [label="episodes:updated", shape=box,fillcolor="white",style="filled"];
  calendarclearcache [label="calendar:clearcache", shape=box,fillcolor="white",style="filled"];
  favoritesupdated [label="favorites:updated", shape=box,fillcolor="white",style="filled"];

  FileReader [label="FileReader",shape=box,fillcolor="#efefef",style="filled"];
  fileProgress [label="fileProgress", shape=box,fillcolor="white",style="filled"];

  MirrorResolver [label="MirrorResolver",shape=box,fillcolor="#efefef",style="filled"];
  mirrorresolverstatus [label="mirrorresolver:status", shape=box,fillcolor="white",style="filled"];

  WatchlistService [label="WatchlistService",shape=box,fillcolor="#efefef",style="filled"];
  watchlistupdated [label="watchlist:updated", shape=box,fillcolor="white",style="filled"];

  }

  ``