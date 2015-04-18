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
    fields: ['ID_Serie', 'name', 'banner', 'overview', 'TVDB_ID', 'IMDB_ID', 'TVRage_ID', 'actors', 'airs_dayofweek', 'airs_time', 'timezone', 'contentrating', 'firstaired', 'genre', 'country', 'language', 'network', 'rating', 'ratingcount', 'runtime', 'status', 'added', 'addedby', 'fanart', 'poster', 'lastupdated', 'lastfetched', 'nextupdate', 'displaycalendar'],
    relations: {
        'Episode': CRUD.RELATION_FOREIGN,
        'Season': CRUD.RELATION_FOREIGN
    },
    indexes: [
        'fanart',
    ],
    createStatement: 'CREATE TABLE "Series" ("ID_Serie" INTEGER PRIMARY KEY NOT NULL,  "name" VARCHAR(250) DEFAULT(NULL),  "banner" VARCHAR(1024) DEFAULT(NULL),  "overview" TEXT DEFAULT(NULL),  "TVDB_ID" INTEGER UNIQUE NOT NULL,  "IMDB_ID" INTEGER DEFAULT(NULL),  "TVRage_ID" INTEGER DEFAULT(NULL), "actors" VARCHAR(1024) DEFAULT(NULL),  "airs_dayofweek" VARCHAR(10) DEFAULT(NULL),  "airs_time" VARCHAR(15) DEFAULT(NULL),  "timezone" VARCHAR(30) DEFAULT(NULL),  "contentrating" VARCHAR(20) DEFAULT(NULL),  "firstaired" DATE DEFAULT(NULL),  "genre" VARCHAR(50) DEFAULT(NULL),  "country" VARCHAR(50) DEFAULT(NULL), "language" VARCHAR(50) DEFAULT(NULL),  "network" VARCHAR(50) DEFAULT(NULL),  "rating" INTEGER DEFAULT(NULL),  "ratingcount" INTEGER DEFAULT(NULL),  "runtime" INTEGER DEFAULT(NULL),  "status" VARCHAR(50) DEFAULT(NULL),  "added" DATE DEFAULT(NULL),  "addedby" VARCHAR(50) DEFAULT(NULL),  "fanart" VARCHAR(150) DEFAULT(NULL),  "poster" VARCHAR(150) DEFAULT(NULL),  "lastupdated" TIMESTAMP DEFAULT (NULL),  "lastfetched" TIMESTAMP DEFAULT (NULL),  "nextupdate" TIMESTAMP DEFAULT (NULL), "displaycalendar" TINYINT DEFAULT(1) )',
    adapter: 'dbAdapter',
    defaultValues: {

    },
    fixtures: [

    ],
    migrations: {
        5: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE "Series" ("ID_Serie" INTEGER PRIMARY KEY NOT NULL,  "name" VARCHAR(250) DEFAULT(NULL),  "banner" VARCHAR(1024) DEFAULT(NULL),  "overview" TEXT DEFAULT(NULL),  "TVDB_ID" INTEGER UNIQUE NOT NULL,  "IMDB_ID" INTEGER DEFAULT(NULL),  "TVRage_ID" INTEGER DEFAULT(NULL),  "networkid" VARCHAR(50) DEFAULT(NULL),  "seriesid" VARCHAR(50) DEFAULT(NULL),  "zap2it_id" VARCHAR(50) DEFAULT(NULL),  "actors" VARCHAR(1024) DEFAULT(NULL),  "airs_dayofweek" VARCHAR(10) DEFAULT(NULL),  "airs_time" VARCHAR(15) DEFAULT(NULL),  "contentrating" VARCHAR(20) DEFAULT(NULL),  "firstaired" DATE DEFAULT(NULL),  "genre" VARCHAR(50) DEFAULT(NULL),  "language" VARCHAR(50) DEFAULT(NULL),  "network" VARCHAR(50) DEFAULT(NULL),  "rating" INTEGER DEFAULT(NULL),  "ratingcount" INTEGER DEFAULT(NULL),  "runtime" INTEGER DEFAULT(NULL),  "status" VARCHAR(50) DEFAULT(NULL),  "added" DATE DEFAULT(NULL),  "addedby" VARCHAR(50) DEFAULT(NULL),  "fanart" VARCHAR(150) DEFAULT(NULL),  "poster" VARCHAR(150) DEFAULT(NULL),  "lastupdated" TIMESTAMP DEFAULT (NULL),  "lastfetched" TIMESTAMP DEFAULT (NULL),  "nextupdate" TIMESTAMP DEFAULT (NULL), "displaycalendar" TINYINT DEFAULT(1) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, networkid, seriesid, zap2it_id, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, networkid, seriesid, zap2it_id, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate from Series_bak',
            'DROP TABLE Series_bak'
        ],
        6: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE "Series" ("ID_Serie" INTEGER PRIMARY KEY NOT NULL,  "name" VARCHAR(250) DEFAULT(NULL),  "banner" VARCHAR(1024) DEFAULT(NULL),  "overview" TEXT DEFAULT(NULL),  "TVDB_ID" INTEGER UNIQUE NOT NULL,  "IMDB_ID" INTEGER DEFAULT(NULL),  "TVRage_ID" INTEGER DEFAULT(NULL), "actors" VARCHAR(1024) DEFAULT(NULL),  "airs_dayofweek" VARCHAR(10) DEFAULT(NULL),  "airs_time" VARCHAR(15) DEFAULT(NULL),  "timezone" VARCHAR(30) DEFAULT(NULL),  "contentrating" VARCHAR(20) DEFAULT(NULL),  "firstaired" DATE DEFAULT(NULL),  "genre" VARCHAR(50) DEFAULT(NULL),  "country" VARCHAR(50) DEFAULT(NULL), "language" VARCHAR(50) DEFAULT(NULL),  "network" VARCHAR(50) DEFAULT(NULL),  "rating" INTEGER DEFAULT(NULL),  "ratingcount" INTEGER DEFAULT(NULL),  "runtime" INTEGER DEFAULT(NULL),  "status" VARCHAR(50) DEFAULT(NULL),  "added" DATE DEFAULT(NULL),  "addedby" VARCHAR(50) DEFAULT(NULL),  "fanart" VARCHAR(150) DEFAULT(NULL),  "poster" VARCHAR(150) DEFAULT(NULL),  "lastupdated" TIMESTAMP DEFAULT (NULL),  "lastfetched" TIMESTAMP DEFAULT (NULL),  "nextupdate" TIMESTAMP DEFAULT (NULL), "displaycalendar" TINYINT DEFAULT(1) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate from Series_bak',
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

    /** 
     * Fetch episodes as object mapped by TVDB_ID
     */
    getEpisodesMap: function() {
        return this.getEpisodes().then(function(result) {
            var out = {};
            result.map(function(episode) {
                out[episode.TVDB_ID] = episode;
            });
            return out;
        });
    },

    getSeasonsByNumber: function() {
        return this.getSeasons().then(function(seasons) {
            var out = {};
            seasons.map(function(el) {
                out[el.seasonnumber] = el;
            });
            return out;
        });
    },

    getLatestSeason: function() {
        return CRUD.FindOne('Season', {
            ID_Serie: this.getID()
        });
    },

    getActiveSeason: function() {
        var firstAiredFilter = {
            Episode: ['firstaired < ' + new Date().getTime()]
        };

        firstAiredFilter.Episode.ID_Serie = this.getID();

        var result = CRUD.FindOne('Season', firstAiredFilter, {
            orderBy: 'ID_Season desc'
        });
        return (result instanceof CRUD.Entity) ? result : this.getLatestSeason();
    },

    getSortName: function() {
        if (!this.sortName) {
            this.sortName = this.name.replace('The ', '');
        }
        return this.sortName;

    }
});



var Season = CRUD.define({
    className: 'Season',
    table: 'Seasons',
    primary: 'ID_Season',
    fields: ['ID_Season', 'ID_Serie', 'poster', 'overview', 'seasonnumber', 'ratings', 'ratingcount'],
    relations: {
        'Serie': CRUD.RELATION_FOREIGN,
        'Episode': CRUD.RELATION_FOREIGN
    },
    indexes: [
        'ID_Serie'
    ],
    orderProperty: 'seasonnumber',
    orderDirection: 'DESC',
    createStatement: 'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), seasonnumber INTEGER, overview TEXT NULL, ratings INTEGER NULL, ratingcount INTEGER NULL,  UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE)',
    adapter: 'dbAdapter',
    defaultValues: {},
    migrations: {
        3: [
            'ALTER TABLE Seasons RENAME TO Seasons_bak',
            'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), seasonnumber INTEGER, overview TEXT NULL, ratings INTEGER NULL, ratingcount INTEGER NULL,  UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE)',
            'INSERT OR IGNORE INTO Seasons (ID_Season, ID_Serie, poster, seasonnumber) select ID_Season, ID_Serie, poster, seasonnumber from Seasons_bak',
            'DROP TABLE Seasons_bak'
        ],
        2: [
            'ALTER TABLE Seasons RENAME TO Seasons_bak',
            'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), seasonnumber INTEGER, UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE)',
            'INSERT OR IGNORE INTO Seasons (ID_Season, ID_Serie, poster, seasonnumber) select ID_Season, ID_Serie, poster, seasonnumber from Seasons_bak',
            'DROP TABLE Seasons_bak'
        ]
    }
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
    fields: ['ID_Episode', 'ID_Serie', 'ID_Season', 'TVDB_ID', 'episodename', 'episodenumber', 'seasonnumber', 'firstaired', 'firstaired_iso', 'IMDB_ID', 'language', 'overview', 'rating', 'ratingcount', 'filename', 'images', 'watched', 'watchedAt', 'downloaded', 'magnetHash'],
    autoSerialize: ['images'],
    relations: {
        'Serie': CRUD.RELATION_FOREIGN,
        'Season': CRUD.RELATION_FOREIGN
    },
    createStatement: 'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER UNIQUE, episodename VARCHAR(255), episodenumber INTEGER , seasonnumber INTEGER NULL ,firstaired TIMESTAMP, firstaired_iso varchar(25), IMDB_ID VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), filename VARCHAR(255) , images TEXT, watched INTEGER DEFAULT 0, watchedAt TIMESTAMP NULL,  downloaded INTEGER DEFAULT 0, magnetHash VARCHAR(40) NULL )',
    adapter: 'dbAdapter',
    defaultValues: {
        watched: 0
    },
    indexes: [
        'watched',
        'TVDB_ID',
        'ID_Serie, firstaired',
        'ID_Season'
    ],
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
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, director, episodename, episodenumber, firstaired, gueststars, imdb_id, language, overview, rating, ratingcount, seasonnumber, writer, filename, lastupdated, seasonid, seriesid, lastchecked, watched, watchedAt) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, director, episodename, episodenumber, firstaired, gueststars, imdb_id, language, overview, rating, ratingcount, seasonnumber, writer, filename, lastupdated, seasonid, seriesid, lastchecked, coalesce(watched, 0), watchedAt from Episodes_bak',
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
        ],
        10: [
            'ALTER TABLE Episodes RENAME TO Episodes_bak',
            'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER UNIQUE, episodename VARCHAR(255), episodenumber INTEGER , seasonnumber INTEGER NULL , firstaired TIMESTAMP, firstaired_iso varchar(25), IMDB_ID VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), filename VARCHAR(255) , images TEXT, watched INTEGER DEFAULT 0, watchedAt TIMESTAMP NULL, downloaded INTEGER DEFAULT 0, magnetHash VARCHAR(40) NULL )',
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, IMDB_ID, language, overview, rating, ratingcount, filename, watched, watchedAt, magnetHash) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, imdb_id, language, overview, rating, ratingcount, filename,  coalesce(watched,0), watchedAt, magnetHash from Episodes_bak;',
            'DROP TABLE Episodes_bak'
        ]
    }
}, {
    watched: {
        get: function() {
            //console.log("accessor override");
            return parseInt(this.get('watched'));
        }
    },
    getSeason: function() {
        return this.FindOne('Season');
    },
    getFormattedEpisode: function() {
        var sn = this.seasonnumber.toString(),
            en = this.episodenumber.toString(),
            out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '0' + en : en].join('');
        return out;
    },
    getAirDate: function() {
        return new Date(this.firstaired).toLocaleString();
    },
    getAirTime: function() {
        return new Date(this.firstaired).toTimeString().substring(0, 5);
    },
    hasAired: function() {
        return this.firstaired && this.firstaired <= new Date().getTime();
    },
    isWatched: function() {
        return this.watched && parseInt(this.watched) == 1;
    },

    markWatched: function($rootScope) {
        this.watched = 1;
        this.watchedAt = new Date().getTime();
        return this.Persist().then(function() {
            if ($rootScope) {
                $rootScope.$broadcast('episode:marked:watched', this);
            }
            return this;
        }.bind(this));
    },

    markNotWatched: function($rootScope) {
        this.watched = 0;
        this.watchedAt = null;
        return this.Persist().then(function() {
            if ($rootScope) {
                $rootScope.$broadcast('episode:marked:notwatched', this);
            }
            return this;
        }.bind(this));
    },

    isDownloaded: function() {
        return this.downloaded && parseInt(this.downloaded) == 1;
    },

    markDownloaded: function($rootScope) {
        this.downloaded = 1;
        return this.Persist().then(function() {
            return this;
        }.bind(this));
    },

    markNotDownloaded: function($rootScope) {
        this.downloaded = 0;
        return this.Persist().then(function() {
            return this;
        }.bind(this));
    },
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

CRUD.DEBUG = false;

CRUD.setAdapter(new CRUD.SQLiteAdapter('seriesguide_chrome', {
    estimatedSize: 25 * 1024 * 1024
}));