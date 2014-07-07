/**
 * These are the entity mappings (ActiveRecord / ORM objects) for DuckieTV.
 * There's an object for each database table where information is stored.
 * These are all based on CreateReadUpdateDelete.js : http://schizoduckie.github.io/CreateReadUpdateDelete.js
 * CRUD.JS creates automatic SQL queries from these objects and handles relationships between them.
 * It also provides the automatic execution of the create statements when a database table is not available.
 */


var Serie = CRUD.define({
    className: 'Serie',
    table: 'Series',
    primary: 'ID_Serie',
    fields: ['ID_Serie', 'name', 'banner', 'overview', 'TVDB_ID', 'IMDB_ID', 'TVRage_ID', 'networkid', 'seriesid', 'zap2it_id', 'actors', 'airs_dayofweek', 'airs_time', 'contentrating', 'firstaired', 'genre', 'language', 'network', 'rating', 'ratingcount', 'runtime', 'status', 'added', 'addedby', 'fanart', 'poster', 'lastupdated', 'lastfetched', 'nextupdate'],
    relations: {
        'Episode': CRUD.RELATION_FOREIGN,
        'Season': CRUD.RELATION_FOREIGN
    },
    createStatement: 'CREATE TABLE "Series" ("ID_Serie" INTEGER PRIMARY KEY NOT NULL,  "name" VARCHAR(250) DEFAULT(NULL),  "banner" VARCHAR(1024) DEFAULT(NULL),  "overview" TEXT DEFAULT(NULL),  "TVDB_ID" INTEGER UNIQUE NOT NULL,  "IMDB_ID" INTEGER DEFAULT(NULL),  "TVRage_ID" INTEGER DEFAULT(NULL),  "networkid" VARCHAR(50) DEFAULT(NULL),  "seriesid" VARCHAR(50) DEFAULT(NULL),  "zap2it_id" VARCHAR(50) DEFAULT(NULL),  "actors" VARCHAR(1024) DEFAULT(NULL),  "airs_dayofweek" VARCHAR(10) DEFAULT(NULL),  "airs_time" VARCHAR(15) DEFAULT(NULL),  "contentrating" VARCHAR(20) DEFAULT(NULL),  "firstaired" DATE DEFAULT(NULL),  "genre" VARCHAR(50) DEFAULT(NULL),  "language" VARCHAR(50) DEFAULT(NULL),  "network" VARCHAR(50) DEFAULT(NULL),  "rating" INTEGER DEFAULT(NULL),  "ratingcount" INTEGER DEFAULT(NULL),  "runtime" INTEGER DEFAULT(NULL),  "status" VARCHAR(50) DEFAULT(NULL),  "added" DATE DEFAULT(NULL),  "addedby" VARCHAR(50) DEFAULT(NULL),  "fanart" VARCHAR(150) DEFAULT(NULL),  "poster" VARCHAR(150) DEFAULT(NULL),  "lastupdated" TIMESTAMP DEFAULT (NULL),  "lastfetched" TIMESTAMP DEFAULT (NULL),  "nextupdate" TIMESTAMP DEFAULT (NULL) )',
    adapter: 'dbAdapter',
    defaultValues: {

    },
    fixtures: [

    ],
    migrations: {
        2: ['UPDATE Series set poster = "http://www.thetvdb.com/banners/" || Series.poster'],
        3: ['UPDATE Series set fanart =  "http://www.thetvdb.com/banners/" || Series.fanart'],
        4: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE "Series" ("ID_Serie" INTEGER PRIMARY KEY NOT NULL,  "name" VARCHAR(250) DEFAULT(NULL),  "banner" VARCHAR(1024) DEFAULT(NULL),  "overview" TEXT DEFAULT(NULL),  "TVDB_ID" INTEGER UNIQUE NOT NULL,  "IMDB_ID" INTEGER DEFAULT(NULL),  "TVRage_ID" INTEGER DEFAULT(NULL),  "networkid" VARCHAR(50) DEFAULT(NULL),  "seriesid" VARCHAR(50) DEFAULT(NULL),  "zap2it_id" VARCHAR(50) DEFAULT(NULL),  "actors" VARCHAR(1024) DEFAULT(NULL),  "airs_dayofweek" VARCHAR(10) DEFAULT(NULL),  "airs_time" VARCHAR(15) DEFAULT(NULL),  "contentrating" VARCHAR(20) DEFAULT(NULL),  "firstaired" DATE DEFAULT(NULL),  "genre" VARCHAR(50) DEFAULT(NULL),  "language" VARCHAR(50) DEFAULT(NULL),  "network" VARCHAR(50) DEFAULT(NULL),  "rating" INTEGER DEFAULT(NULL),  "ratingcount" INTEGER DEFAULT(NULL),  "runtime" INTEGER DEFAULT(NULL),  "status" VARCHAR(50) DEFAULT(NULL),  "added" DATE DEFAULT(NULL),  "addedby" VARCHAR(50) DEFAULT(NULL),  "fanart" VARCHAR(150) DEFAULT(NULL),  "poster" VARCHAR(150) DEFAULT(NULL),  "lastupdated" TIMESTAMP DEFAULT (NULL),  "lastfetched" TIMESTAMP DEFAULT (NULL),  "nextupdate" TIMESTAMP DEFAULT (NULL) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, networkid, seriesid, zap2it_id, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, networkid, seriesid, zap2it_id, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate from Series_bak',
            'DROP TABLE Series_bak'
        ]
    }

}, {

    getEpisodes: function() {
        return CRUD.Find('Episode', {
            ID_Serie: this.getID()
        }, {
            limit: 100000
        }).then(function(episodes) {
            return episodes;
        });
    },

    getSeasons: function() {
        return CRUD.Find('Season', {
            ID_Serie: this.getID()
        });
    },

    getLatestSeason: function() {
        return CRUD.FindOne('Season', {
            ID_Serie: this.getID()
        });
    }
});



var Season = CRUD.define({
    className: 'Season',
    table: 'Seasons',
    primary: 'ID_Season',
    fields: ['ID_Season', 'ID_Serie', 'poster', 'seasonnumber'],
    relations: {
        'Serie': CRUD.RELATION_FOREIGN,
        'Episode': CRUD.RELATION_FOREIGN
    },
    orderProperty: 'seasonnumber',
    orderDirection: 'DESC',
    createStatement: 'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), seasonnumber INTEGER)',
    adapter: 'dbAdapter',
    defaultValues: {}
}, {

    getEpisodes: function() {
        return CRUD.Find('Episode', {
            ID_Season: this.getID()
        });
    }
});

var Episode = CRUD.define({
    className: 'Episode',
    table: 'Episodes',
    primary: 'ID_Episode',
    fields: ['ID_Episode', 'ID_Serie', 'ID_Season', 'TVDB_ID', 'episodename', 'episodenumber', 'firstaired', 'imdb_id', 'language', 'overview', 'rating', 'ratingcount', 'seasonnumber', 'filename', 'lastupdated', 'seasonid', 'seriesid', 'lastchecked', 'watched', 'watchedAt', 'magnetHash'],
    relations: {
        'Serie': CRUD.RELATION_FOREIGN,
        'Season': CRUD.RELATION_FOREIGN
    },
    createStatement: 'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER UNIQUE, episodename VARCHAR(255), episodenumber INTEGER , firstaired TIMESTAMP , imdb_id VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL) , seasonnumber INTEGER NULL , filename VARCHAR(255) , lastupdated TIMESTAMP , seasonid INTEGER NULL , seriesid INTEGER NULL , lastchecked TIMESTAMP NULL, watched VARCHAR(1), watchedAt TIMESTAMP NULL, magnetHash VARCHAR(40) NULL )',
    adapter: 'dbAdapter',
    defaultValues: {
        watched: 0
    },
    fixtures: [

    ],
    migrations: {
        2: ['ALTER TABLE Episodes RENAME TO Episodes_bak',
            'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER NULL,director VARCHAR(255), episodename VARCHAR(255), episodenumber INTEGER , firstaired TIMESTAMP , gueststars VARCHAR(255), imdb_id VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating VARCHAR(5), ratingcount INTEGER NULL , seasonnumber INTEGER NULL , writer VARCHAR(100) , filename VARCHAR(255) , lastupdated TIMESTAMP , seasonid INTEGER NULL , seriesid INTEGER NULL , lastchecked TIMESTAMP NULL, watched VARCHAR(1), watchedAt TIMESTAMP NULL)',
            'INSERT INTO Episodes (ID_Episode, ID_Serie, TVDB_ID, director, episodename, episodenumber, firstaired, gueststars, imdb_id, language, overview, rating, ratingcount, seasonnumber, writer, filename, lastupdated, seasonid, seriesid, lastchecked, watched, watchedAt) select ID_Episode, ID_Serie, TVDB_ID, director, episodename, episodenumber, firstaired, gueststars, imdb_id, language, overview, rating, ratingcount, seasonnumber, writer, filename, lastupdated, seasonid, seriesid, lastchecked, watched, watchedAt from Episodes_bak',
            'DROP TABLE Episodes_bak'
        ],
        3: [],
        4: [
            'ALTER TABLE Episodes RENAME TO Episodes_bak',
            'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER UNIQUE,director VARCHAR(255), episodename VARCHAR(255), episodenumber INTEGER , firstaired TIMESTAMP , gueststars VARCHAR(255), imdb_id VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating VARCHAR(5), ratingcount INTEGER NULL , seasonnumber INTEGER NULL , writer VARCHAR(100) , filename VARCHAR(255) , lastupdated TIMESTAMP , seasonid INTEGER NULL , seriesid INTEGER NULL , lastchecked TIMESTAMP NULL, watched VARCHAR(1), watchedAt TIMESTAMP NULL, magnetHash VARCHAR(40) NULL)',
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, director, episodename, episodenumber, firstaired, gueststars, imdb_id, language, overview, rating, ratingcount, seasonnumber, writer, filename, lastupdated, seasonid, seriesid, lastchecked, watched, watchedAt) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, director, episodename, episodenumber, firstaired, gueststars, imdb_id, language, overview, rating, ratingcount, seasonnumber, writer, filename, lastupdated, seasonid, seriesid, lastchecked, watched, watchedAt from Episodes_bak',
            'DROP TABLE Episodes_bak'
        ],
        5: [
            'CREATE INDEX IF NOT EXISTS firstaired_idx ON Episodes (firstaired)',
            'CREATE INDEX IF NOT EXISTS ID_Serie_idx ON Episodes (ID_Serie)'
        ],
        6: [
            'UPDATE Episodes set watched = "1" where watched = 1.0'
        ],
        7: [
            'ALTER TABLE Episodes RENAME TO Episodes_bak',
            'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER UNIQUE, episodename VARCHAR(255), episodenumber INTEGER , firstaired TIMESTAMP , imdb_id VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating VARCHAR(5), ratingcount INTEGER NULL , seasonnumber INTEGER NULL , filename VARCHAR(255) , lastupdated TIMESTAMP , seasonid INTEGER NULL , seriesid INTEGER NULL , lastchecked TIMESTAMP NULL, watched VARCHAR(1), watchedAt TIMESTAMP NULL, magnetHash VARCHAR(40) NULL)',
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, firstaired, imdb_id, language, overview, rating, ratingcount, seasonnumber, filename, lastupdated, seasonid, seriesid, lastchecked, watched, watchedAt, magnetHash) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, firstaired, imdb_id, language, overview, rating, ratingcount, seasonnumber, filename, lastupdated, seasonid, seriesid, lastchecked, watched, watchedAt, magnetHash from Episodes_bak',
            'DROP TABLE Episodes_bak'
        ],
        8: [
            'ALTER TABLE Episodes RENAME TO Episodes_bak',
            'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER UNIQUE, episodename VARCHAR(255), episodenumber INTEGER , firstaired TIMESTAMP , imdb_id VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL) , seasonnumber INTEGER NULL , filename VARCHAR(255) , lastupdated TIMESTAMP , seasonid INTEGER NULL , seriesid INTEGER NULL , lastchecked TIMESTAMP NULL, watched VARCHAR(1), watchedAt TIMESTAMP NULL, magnetHash VARCHAR(40) NULL )',
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, firstaired, imdb_id, language, overview, rating, ratingcount, seasonnumber, filename, lastupdated, seasonid, seriesid, lastchecked, watched, watchedAt, magnetHash) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, firstaired, imdb_id, language, overview, rating, ratingcount, seasonnumber, filename, lastupdated, seasonid, seriesid, lastchecked, watched, watchedAt, magnetHash from Episodes_bak',
            'DROP TABLE Episodes_bak'
        ],
        9: [
            'UPDATE Episodes set watched = "1" where watched = 1.0'
        ]
    }
}, {

    getSeason: function() {
        return this.FindOne('Season');
    },
    getFormattedEpisode: function() {
        var sn = this.get('seasonnumber').toString(),
            en = this.get('episodenumber').toString(),
            out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '0' + en : en].join('');
        return out;
    },
    getAirDate: function() {
        return new Date(this.get('firstaired')).toLocaleString();
    },
    hasAired: function() {
        return this.get('firstaired') && this.get('firstaired') <= new Date().getTime();
    },

    markWatched: function($rootScope) {
        this.set('watched', '1');
        this.set('watchedAt', new Date().getTime());
        return this.Persist().then(function() {
            if ($rootScope) {
                $rootScope.$broadcast('episode:marked:watched', this);
            }
            return this;
        }.bind(this));
    },

    markNotWatched: function($rootScope) {
        this.set('watched', '0');
        this.set('watchedAt', null);
        return this.Persist().then(function() {
            if ($rootScope) {
                $rootScope.$broadcast('episode:marked:notwatched', this);
            }
            return this;
        }.bind(this));
    },

});

/** 
 * ScheduledEvents are hooked into the EventScheduler / EventWatcher services.
 * A $rootScope.$broadcast is executed when a timer is executed and the parameters from $data are passed.
 * The EventScheduler creates timers in chrome's alarms database for efficient timer execution and background
 * processing.
 */
var ScheduledEvent = CRUD.define({
    className: 'ScheduledEvent',
    table: 'EventSchedule',
    primary: 'ID_Event',
    fields: ['ID_Event', 'name', 'type', 'eventchannel', 'data'],
    createStatement: 'CREATE TABLE EventSchedule ( ID_Event INTEGER PRIMARY KEY NOT NULL, name VARCHAR(255) NOT NULL, type varchar(25) NOT NULL, eventchannel VARCHAR(255) NULL, data TEXT NULL)',
    adapter: 'dbAdapter'
}, {

});

var WatchListItem = CRUD.define({
    className: 'WatchListItem',
    table: 'WatchList',
    primary: 'ID_WatchListItem',
    fields: ['ID_WatchListItem', 'searchstring', 'watchservice', 'downloaded', 'watched', 'lastchecked'],
    createStatement: 'CREATE TABLE WatchList ( ID_WatchListItem INTEGER PRIMARY KEY NOT NULL, searchstring varchar(255) NOT NULL, watchservice VARCHAR(25) NULL, downloaded SMALLINT, watched SMALLINT, lastchecked TIMESTAMP)',
    adapter: 'dbAdapter',
    relations: {
        'WatchListObject': CRUD.RELATION_FOREIGN
    },
    defaultValues: {
        watched: '0',
        downloaded: '0',
    }
}, {
    imdb: null

});

var WatchListObject = CRUD.define({
    className: 'WatchListObject',
    table: 'WatchListObject',
    primary: 'ID_WatchListObject',
    fields: ['ID_WatchListObject', 'ID_WatchListItem', 'property', 'json'],
    createStatement: 'CREATE TABLE WatchListObject ( ID_WatchListObject INTEGER PRIMARY KEY NOT NULL, ID_WatchListItem INTEGER NOT NULL, property VARCHAR(25) NULL, json TEXT)',
    adapter: 'dbAdapter',
    relations: {
        'WatchListItem': CRUD.RELATION_FOREIGN
    },

}, {

});


CRUD.setAdapter(new CRUD.SQLiteAdapter('seriesguide_chrome'));