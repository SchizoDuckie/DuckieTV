/**
 * These are the entity mappings (ActiveRecord / ORM objects) for DuckieTV.
 * There's an object for each database table where information is stored.
 * These are all based on CreateReadUpdateDelete.js : http://schizoduckie.github.io/CreateReadUpdateDelete.js
 * CRUD.JS creates automatic SQL queries from these objects and handles relationships between them.
 * It also provides the automatic execution of the create statements when a database table is not available.
 */


/** 
 * Define POJO named functions for all the entities used.
 * These will be extended by CreateReadUpdateDelete.js. It is important to call the CRUD.Entity constructor
 * So that each instance can be set up with instance __values__ and __dirtyValues__ properties.
 */
function Serie() {
    CRUD.Entity.call(this);
}

function Season() {
    CRUD.Entity.call(this);
}

function Episode() {
    CRUD.Entity.call(this);
}

function Fanart() {
    CRUD.Entity.call(this);
}

function Jackett() {
    CRUD.Entity.call(this);
}


/**
 * Allow CRUD.js to register itself and the properties defined on each named function.
 */

CRUD.define(Serie, {
    className: 'Serie',
    table: 'Series',
    primary: 'ID_Serie',
    fields: ['ID_Serie', 'name', 'banner', 'overview', 'TVDB_ID', 'IMDB_ID', 'TVRage_ID', 'actors', 'airs_dayofweek', 'airs_time', 'timezone', 'contentrating', 'firstaired', 'genre', 'country', 'language', 'network', 'rating', 'ratingcount', 'runtime', 'status', 'added', 'addedby', 'fanart', 'poster', 'lastupdated', 'lastfetched', 'nextupdate', 'displaycalendar', 'autoDownload', 'customSearchString', 'watched', 'notWatchedCount', 'ignoreGlobalQuality', 'ignoreGlobalIncludes', 'ignoreGlobalExcludes', 'searchProvider', 'ignoreHideSpecials', 'customSearchSizeMin', 'customSearchSizeMax', 'TRAKT_ID', 'dlPath', 'customDelay', 'alias', 'customFormat'],
    relations: {
        'Episode': CRUD.RELATION_FOREIGN,
        'Season': CRUD.RELATION_FOREIGN
    },
    indexes: [
        'fanart',
        'TRAKT_ID',
    ],
    createStatement: 'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER DEFAULT(NULL), IMDB_ID VARCHAR(20) DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), ignoreGlobalQuality TINYINT DEFAULT(0), ignoreGlobalIncludes TINYINT DEFAULT(0), ignoreGlobalExcludes TINYINT DEFAULT(0), searchProvider VARCHAR(20) DEFAULT(NULL), ignoreHideSpecials TINYINT DEFAULT(0), customSearchSizeMin INTEGER DEFAULT(NULL), customSearchSizeMax INTEGER DEFAULT(NULL), TRAKT_ID INTEGER DEFAULT(NULL), dlPath TEXT DEFAULT(NULL), customDelay INTEGER DEFAULT(NULL), alias VARCHAR(250) DEFAULT(NULL), customFormat VARCHAR(20) DEFAULT(NULL) )',

    adapter: 'dbAdapter',
    defaultValues: {

    },
    fixtures: [

    ],
    migrations: {
        5: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), networkid VARCHAR(50) DEFAULT(NULL), seriesid VARCHAR(50) DEFAULT(NULL), zap2it_id VARCHAR(50) DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, networkid, seriesid, zap2it_id, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, networkid, seriesid, zap2it_id, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate from Series_bak',
            'DROP TABLE Series_bak'
        ],
        6: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate from Series_bak',
            'DROP TABLE Series_bak'
        ],
        7: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar from Series_bak',
            'DROP TABLE Series_bak'
        ],
        8: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched from Series_bak',
            'DROP TABLE Series_bak'
        ],
        9: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), ignoreGlobalQuality TINYINT DEFAULT(0), ignoreGlobalIncludes TINYINT DEFAULT(0), ignoreGlobalExcludes TINYINT DEFAULT(0) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount from Series_bak',
            'DROP TABLE Series_bak'
        ],
        10: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), ignoreGlobalQuality TINYINT DEFAULT(0), ignoreGlobalIncludes TINYINT DEFAULT(0), ignoreGlobalExcludes TINYINT DEFAULT(0), searchProvider VARCHAR(20) DEFAULT(NULL) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes from Series_bak',
            'DROP TABLE Series_bak'
        ],
        11: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), ignoreGlobalQuality TINYINT DEFAULT(0), ignoreGlobalIncludes TINYINT DEFAULT(0), ignoreGlobalExcludes TINYINT DEFAULT(0), searchProvider VARCHAR(20) DEFAULT(NULL), ignoreHideSpecials TINYINT DEFAULT(0) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes, searchProvider) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes, searchProvider from Series_bak',
            'DROP TABLE Series_bak'
        ],
        12: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), ignoreGlobalQuality TINYINT DEFAULT(0), ignoreGlobalIncludes TINYINT DEFAULT(0), ignoreGlobalExcludes TINYINT DEFAULT(0), searchProvider VARCHAR(20) DEFAULT(NULL), ignoreHideSpecials TINYINT DEFAULT(0), customSearchSizeMin INTEGER DEFAULT(NULL), customSearchSizeMax INTEGER DEFAULT(NULL) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes, searchProvider, ignoreHideSpecials) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes, searchProvider, ignoreHideSpecials from Series_bak',
            'DROP TABLE Series_bak'
        ],
        13: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER DEFAULT(NULL), IMDB_ID VARCHAR(20) DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), ignoreGlobalQuality TINYINT DEFAULT(0), ignoreGlobalIncludes TINYINT DEFAULT(0), ignoreGlobalExcludes TINYINT DEFAULT(0), searchProvider VARCHAR(20) DEFAULT(NULL), ignoreHideSpecials TINYINT DEFAULT(0), customSearchSizeMin INTEGER DEFAULT(NULL), customSearchSizeMax INTEGER DEFAULT(NULL), TRAKT_ID INTEGER DEFAULT(NULL) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes, searchProvider, ignoreHideSpecials, customSearchSizeMin, customSearchSizeMax) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes, searchProvider, ignoreHideSpecials, customSearchSizeMin, customSearchSizeMax from Series_bak',
            'DROP TABLE Series_bak'
        ],
        14: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER DEFAULT(NULL), IMDB_ID VARCHAR(20) DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), ignoreGlobalQuality TINYINT DEFAULT(0), ignoreGlobalIncludes TINYINT DEFAULT(0), ignoreGlobalExcludes TINYINT DEFAULT(0), searchProvider VARCHAR(20) DEFAULT(NULL), ignoreHideSpecials TINYINT DEFAULT(0), customSearchSizeMin INTEGER DEFAULT(NULL), customSearchSizeMax INTEGER DEFAULT(NULL), TRAKT_ID INTEGER DEFAULT(NULL), dlPath TEXT DEFAULT(NULL) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes, searchProvider, ignoreHideSpecials, customSearchSizeMin, customSearchSizeMax, TRAKT_ID) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes, searchProvider, ignoreHideSpecials, customSearchSizeMin, customSearchSizeMax, TRAKT_ID from Series_bak',
            'DROP TABLE Series_bak'
        ],
        15: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER DEFAULT(NULL), IMDB_ID VARCHAR(20) DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), ignoreGlobalQuality TINYINT DEFAULT(0), ignoreGlobalIncludes TINYINT DEFAULT(0), ignoreGlobalExcludes TINYINT DEFAULT(0), searchProvider VARCHAR(20) DEFAULT(NULL), ignoreHideSpecials TINYINT DEFAULT(0), customSearchSizeMin INTEGER DEFAULT(NULL), customSearchSizeMax INTEGER DEFAULT(NULL), TRAKT_ID INTEGER DEFAULT(NULL), dlPath TEXT DEFAULT(NULL), customDelay INTEGER DEFAULT(NULL) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes, searchProvider, ignoreHideSpecials, customSearchSizeMin, customSearchSizeMax, TRAKT_ID, dlPath) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes, searchProvider, ignoreHideSpecials, customSearchSizeMin, customSearchSizeMax, TRAKT_ID, dlPath from Series_bak',
            'DROP TABLE Series_bak'
        ],
        16: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER DEFAULT(NULL), IMDB_ID VARCHAR(20) DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), ignoreGlobalQuality TINYINT DEFAULT(0), ignoreGlobalIncludes TINYINT DEFAULT(0), ignoreGlobalExcludes TINYINT DEFAULT(0), searchProvider VARCHAR(20) DEFAULT(NULL), ignoreHideSpecials TINYINT DEFAULT(0), customSearchSizeMin INTEGER DEFAULT(NULL), customSearchSizeMax INTEGER DEFAULT(NULL), TRAKT_ID INTEGER DEFAULT(NULL), dlPath TEXT DEFAULT(NULL), customDelay INTEGER DEFAULT(NULL), alias VARCHAR(250) DEFAULT(NULL), customFormat VARCHAR(20) DEFAULT(NULL) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes, searchProvider, ignoreHideSpecials, customSearchSizeMin, customSearchSizeMax, TRAKT_ID, dlPath, customDelay) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched, notWatchedCount, ignoreGlobalQuality, ignoreGlobalIncludes, ignoreGlobalExcludes, searchProvider, ignoreHideSpecials, customSearchSizeMin, customSearchSizeMax, TRAKT_ID, dlPath, customDelay from Series_bak',
            'DROP TABLE Series_bak'
        ]
    }
}, {

    getEpisodes: function() {
        return Episode.findBySerie({
            ID_Serie: this.getID()
        }, {
            limit: 100000
        });
    },

    getSeasons: function() {
        return Season.findByID_Serie(this.getID());
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
        return Season.findOneByID_Serie(this.getID());
    },

    getActiveSeason: function() {
        var firstAiredFilter = {
            Episode: ['Episodes.ID_Serie = ' + this.getID() + ' AND Episodes.seasonnumber > 0 AND Episodes.firstaired < ' + new Date().getTime()]
        };
        var self = this;

        return CRUD.FindOne('Season', firstAiredFilter, {
            orderBy: 'ID_Season desc'
        }).then(function(result) {
            return result ? result : self.getLatestSeason().then(function(result) {
                return result;
            });
        });
    },

    getNotWatchedSeason: function() {
        var notWatchedFilter = {
            Episode: ['Episodes.ID_Serie = ' + this.getID() + ' AND Episodes.seasonnumber > 0 AND Episodes.watched = 0']
        };
        var self = this;

        return CRUD.FindOne('Season', notWatchedFilter, {
            orderBy: 'seasonnumber asc'
        }).then(function(result) {
            return result ? result : self.getLatestSeason().then(function(result) {
                return result;
            });
        });
    },

    getSortName: function() {
        if (!this.sortName) {
            this.sortName = this.name.replace('The ', '');
        }
        return this.sortName;
    },

    getNextEpisode: function() {
        var filter = ['(Episodes.ID_Serie = ' + this.getID() + ' AND Episodes.firstaired > ' + new Date().getTime() + ') or (Episodes.ID_Serie = ' + this.getID() + ' AND  Episodes.firstaired = 0)'];
        return CRUD.FindOne('Episode', filter, {
            orderBy: 'seasonnumber desc, episodenumber asc, firstaired asc'
        }).then(function(result) {
            return result;
        });
    },

    getLastEpisode: function() {
        var filter = ['(Episodes.ID_Serie = ' + this.getID() + ' AND Episodes.firstaired > 0 and Episodes.firstAired < ' + new Date().getTime() + ')'];
        return CRUD.FindOne('Episode', filter, {
            orderBy: 'seasonnumber desc, episodenumber desc, firstaired desc'
        }).then(function(result) {
            return result;
        });
    },

    toggleAutoDownload: function() {
        this.autoDownload = this.autoDownload == 1 ? 0 : 1;
        this.Persist();
    },

    toggleCalendarDisplay: function() {
        this.displaycalendar = this.displaycalendar == 1 ? 0 : 1;
        this.Persist();
    },

    markSerieAsWatched: function(watchedDownloadedPaired, $rootScope) {
        var self = this;
        return new Promise(function(resolve) {
            self.getEpisodes().then(function(episodes) {
                episodes.forEach(function(episode) {
                    if (episode.hasAired() && (!episode.isWatched())) {
                        return episode.markWatched(watchedDownloadedPaired, $rootScope);
                    }
                });
                return resolve(true);
            });
        });
    },

    markSerieAsDownloaded: function($rootScope) {
        var self = this;
        return new Promise(function(resolve) {
            self.getEpisodes().then(function(episodes) {
                episodes.forEach(function(episode) {
                    if (episode.hasAired() && (!episode.isDownloaded())) {
                        return episode.markDownloaded($rootScope);
                    }
                });
                return resolve(true);
            });
        });
    },

    markSerieAsUnWatched: function($rootScope) {
        var self = this;
        return new Promise(function(resolve) {
            self.getEpisodes().then(function(episodes) {
                episodes.forEach(function(episode) {
                    if (episode.isWatched()) {
                        return episode.markNotWatched($rootScope);
                    }
                });
                return resolve(true);
            });
        });
    },

    isAnime: function() {
        return (this.genre && this.genre.indexOf('anime') > -1);
    }
});


CRUD.define(Season, {
    className: 'Season',
    table: 'Seasons',
    primary: 'ID_Season',
    fields: ['ID_Season', 'ID_Serie', 'poster', 'overview', 'seasonnumber', 'ratings', 'ratingcount', 'watched', 'notWatchedCount', 'TRAKT_ID'],
    relations: {
        'Serie': CRUD.RELATION_FOREIGN,
        'Episode': CRUD.RELATION_FOREIGN
    },
    indexes: [
        'ID_Serie'
    ],
    orderProperty: 'seasonnumber',
    orderDirection: 'DESC',
    createStatement: 'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), overview TEXT NULL, seasonnumber INTEGER, ratings INTEGER NULL, ratingcount INTEGER NULL, watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), TRAKT_ID INTEGER DEFAULT(NULL), UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE )',
    adapter: 'dbAdapter',
    defaultValues: {},
    migrations: {
        2: [
            'ALTER TABLE Seasons RENAME TO Seasons_bak',
            'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), seasonnumber INTEGER, UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE)',
            'INSERT OR IGNORE INTO Seasons (ID_Season, ID_Serie, poster, seasonnumber) select ID_Season, ID_Serie, poster, seasonnumber from Seasons_bak',
            'DROP TABLE Seasons_bak'
        ],
        3: [
            'ALTER TABLE Seasons RENAME TO Seasons_bak',
            'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), seasonnumber INTEGER, overview TEXT NULL, ratings INTEGER NULL, ratingcount INTEGER NULL, UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE)',
            'INSERT OR IGNORE INTO Seasons (ID_Season, ID_Serie, poster, seasonnumber) select ID_Season, ID_Serie, poster, seasonnumber from Seasons_bak',
            'DROP TABLE Seasons_bak'
        ],
        4: [
            'ALTER TABLE Seasons RENAME TO Seasons_bak',
            'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), seasonnumber INTEGER, overview TEXT NULL, ratings INTEGER NULL, ratingcount INTEGER NULL, watched TINYINT DEFAULT(0), UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE)',
            'INSERT OR IGNORE INTO Seasons (ID_Season, ID_Serie, poster, overview, seasonnumber, ratings, ratingcount) select ID_Season, ID_Serie, poster, overview, seasonnumber, ratings, ratingcount from Seasons_bak',
            'DROP TABLE Seasons_bak'
        ],
        5: [
            'ALTER TABLE Seasons RENAME TO Seasons_bak',
            'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), overview TEXT NULL, seasonnumber INTEGER, ratings INTEGER NULL, ratingcount INTEGER NULL, watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE )',
            'INSERT OR IGNORE INTO Seasons (ID_Season, ID_Serie, poster, overview, seasonnumber, ratings, ratingcount,watched) select ID_Season, ID_Serie, poster, overview, seasonnumber, ratings, ratingcount,watched from Seasons_bak',
            'DROP TABLE Seasons_bak'
        ],
        6: [
            'ALTER TABLE Seasons RENAME TO Seasons_bak',
            'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), overview TEXT NULL, seasonnumber INTEGER, ratings INTEGER NULL, ratingcount INTEGER NULL, watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), TRAKT_ID INTEGER DEFAULT(NULL), UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE )',
            'INSERT OR IGNORE INTO Seasons (ID_Season, ID_Serie, poster, overview, seasonnumber, ratings, ratingcount,watched, notWatchedCount) select ID_Season, ID_Serie, poster, overview, seasonnumber, ratings, ratingcount,watched, notWatchedCount from Seasons_bak',
            'DROP TABLE Seasons_bak'
        ]
    }
}, {
    getEpisodes: function() {
        return Episode.findByID_Season(this.getID());
    },
    markSeasonAsWatched: function(watchedDownloadedPaired, $rootScope) {
        var self = this;
        return new Promise(function(resolve) {
            self.getEpisodes().then(function(episodes) {
                episodes.forEach(function(episode) {
                    if (episode.hasAired() && (!episode.isWatched())) {
                        return episode.markWatched(watchedDownloadedPaired, $rootScope);
                    }
                });
                self.watched = 1;
                self.Persist();
                return resolve(true);
            });
        });
    },
    markSeasonAsUnWatched: function($rootScope) {
        var self = this;
        return new Promise(function(resolve) {
            self.getEpisodes().then(function(episodes) {
                episodes.forEach(function(episode) {
                    if (episode.isWatched()) {
                        return episode.markNotWatched($rootScope);
                    }
                });
                self.watched = 0;
                self.Persist();
                return resolve(true);
            });
        });
    }
});


CRUD.define(Episode, {
    className: 'Episode',
    table: 'Episodes',
    primary: 'ID_Episode',
    fields: ['ID_Episode', 'ID_Serie', 'ID_Season', 'TVDB_ID', 'episodename', 'episodenumber', 'seasonnumber', 'firstaired', 'firstaired_iso', 'IMDB_ID', 'language', 'overview', 'rating', 'ratingcount', 'filename', 'images', 'watched', 'watchedAt', 'downloaded', 'magnetHash', 'TRAKT_ID', 'leaked', 'absolute'],
    autoSerialize: ['images'],
    relations: {
        'Serie': CRUD.RELATION_FOREIGN,
        'Season': CRUD.RELATION_FOREIGN
    },
    createStatement: 'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL, ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER DEFAULT(NULL), episodename VARCHAR(255), episodenumber INTEGER , seasonnumber INTEGER NULL ,firstaired TIMESTAMP, firstaired_iso varchar(25), IMDB_ID VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), filename VARCHAR(255), images TEXT, watched INTEGER DEFAULT 0, watchedAt TIMESTAMP NULL, downloaded INTEGER DEFAULT 0, magnetHash VARCHAR(40) NULL, TRAKT_ID INTEGER NULL, leaked INTEGER DEFAULT 0, absolute INTEGER NULL )',
    adapter: 'dbAdapter',
    indexes: [
        'watched',
        'TVDB_ID',
        'TRAKT_ID',
        'ID_Serie, firstaired',
        'ID_Season'
    ],
    fixtures: [

    ],
    migrations: {
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
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, IMDB_ID, language, overview, rating, ratingcount, filename, watched, watchedAt, magnetHash) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, imdb_id, language, overview, rating, ratingcount, filename, coalesce(watched,0), watchedAt, magnetHash from Episodes_bak;',
            'DROP TABLE Episodes_bak'
        ],
        11: [
            'ALTER TABLE Episodes RENAME TO Episodes_bak',
            'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER UNIQUE, episodename VARCHAR(255), episodenumber INTEGER , seasonnumber INTEGER NULL ,firstaired TIMESTAMP, firstaired_iso varchar(25), IMDB_ID VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), filename VARCHAR(255) , images TEXT, watched INTEGER DEFAULT 0, watchedAt TIMESTAMP NULL, downloaded INTEGER DEFAULT 0, magnetHash VARCHAR(40) NULL, TRAKT_ID INTEGER NULL )',
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, IMDB_ID, language, overview, rating, ratingcount, filename, images, watched, watchedAt, downloaded, magnetHash) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, imdb_id, language, overview, rating, ratingcount, filename, images, coalesce(watched,0), watchedAt, downloaded, magnetHash from Episodes_bak;',
            'DROP TABLE Episodes_bak'
        ],
        12: [
            'ALTER TABLE Episodes RENAME TO Episodes_bak',
            'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER UNIQUE, episodename VARCHAR(255), episodenumber INTEGER , seasonnumber INTEGER NULL ,firstaired TIMESTAMP, firstaired_iso varchar(25), IMDB_ID VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), filename VARCHAR(255) , images TEXT, watched INTEGER DEFAULT 0, watchedAt TIMESTAMP NULL, downloaded INTEGER DEFAULT 0, magnetHash VARCHAR(40) NULL, TRAKT_ID INTEGER NULL, leaked INTEGER DEFAULT 0 )',
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, IMDB_ID, language, overview, rating, ratingcount, filename, images, watched, watchedAt, downloaded, magnetHash, TRAKT_ID) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, imdb_id, language, overview, rating, ratingcount, filename, images, watched, watchedAt, downloaded, magnetHash, TRAKT_ID from Episodes_bak;',
            'DROP TABLE Episodes_bak'
        ],
        13: [
            'ALTER TABLE Episodes RENAME TO Episodes_bak',
            'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER DEFAULT(NULL), episodename VARCHAR(255), episodenumber INTEGER , seasonnumber INTEGER NULL ,firstaired TIMESTAMP, firstaired_iso varchar(25), IMDB_ID VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), filename VARCHAR(255) , images TEXT, watched INTEGER DEFAULT 0, watchedAt TIMESTAMP NULL, downloaded INTEGER DEFAULT 0, magnetHash VARCHAR(40) NULL, TRAKT_ID INTEGER NULL, leaked INTEGER DEFAULT 0 )',
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, IMDB_ID, language, overview, rating, ratingcount, filename, images, watched, watchedAt, downloaded, magnetHash, TRAKT_ID, leaked) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, imdb_id, language, overview, rating, ratingcount, filename, images, watched, watchedAt, downloaded, magnetHash, TRAKT_ID, leaked from Episodes_bak;',
            'DROP TABLE Episodes_bak'
        ],
        14: [
            'ALTER TABLE Episodes RENAME TO Episodes_bak',
            'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL, ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER DEFAULT(NULL), episodename VARCHAR(255), episodenumber INTEGER , seasonnumber INTEGER NULL ,firstaired TIMESTAMP, firstaired_iso varchar(25), IMDB_ID VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), filename VARCHAR(255), images TEXT, watched INTEGER DEFAULT 0, watchedAt TIMESTAMP NULL, downloaded INTEGER DEFAULT 0, magnetHash VARCHAR(40) NULL, TRAKT_ID INTEGER NULL, leaked INTEGER DEFAULT 0, absolute INTEGER NULL )',
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, firstaired_iso, IMDB_ID, language, overview, rating, ratingcount, filename, images, watched, watchedAt, downloaded, magnetHash, TRAKT_ID, leaked) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, firstaired_iso, IMDB_ID, language, overview, rating, ratingcount, filename, images, watched, watchedAt, downloaded, magnetHash, TRAKT_ID, leaked from Episodes_bak;',
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
        return this.formatEpisode(this.seasonnumber, this.episodenumber, this.absolute);
    },

    formatEpisode: function(season, episode, absolute) {
        absolute = absolute || '';
        var sn = season.toString(),
            en = episode.toString(),
            abs = absolute.toString(),
            out = ['s', sn.length == 1 ? '0' + sn : sn, 'e', en.length == 1 ? '0' + en : en, abs != '' ? abs.length == 1 ? '(0' + abs + ')' : '(' + abs + ')': ''].join('');
        return out;
    },

    getAirDate: function() {
        return this.firstaired === 0 ? '?' : new Date(this.firstaired);
    },
    getAirTime: function() {
        if (!this.cachedAirTime) {
            this.cachedAirTime = new Date(this.firstaired).toTimeString().substring(0, 5);
        }
        return this.cachedAirTime;
    },
    hasAired: function() {
        return this.firstaired && this.firstaired !== 0 && this.firstaired <= new Date().getTime();
    },
    isWatched: function() {
        return this.watched && parseInt(this.watched) == 1;
    },
    isLeaked: function() {
        return this.leaked && parseInt(this.leaked) == 1;
    },

    markWatched: function(watchedDownloadedPaired, $rootScope) {
        if (typeof watchedDownloadedPaired === 'undefined') {
            watchedDownloadedPaired = true;
        }
        this.watched = 1;
        this.watchedAt = new Date().getTime();
        if (watchedDownloadedPaired) {
            // if you are marking this as watched you must have also downloaded it!
            this.downloaded = 1;
        }
        return this.Persist().then(function() {
            if ($rootScope) {
                $rootScope.$broadcast('episode:marked:watched', this);
                if (watchedDownloadedPaired) {
                    $rootScope.$broadcast('episode:marked:downloaded', this);
                }
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
            if ($rootScope) {
                $rootScope.$broadcast('episode:marked:downloaded', this);
            }
            return this;
        }.bind(this));
    },

    markNotDownloaded: function(watchedDownloadedPaired, $rootScope) {
        if (typeof watchedDownloadedPaired === 'undefined') {
            watchedDownloadedPaired = true;
        }
        this.downloaded = 0;
        if (watchedDownloadedPaired) {
            // if you are marking this as NOT downloaded, you can not have watched it either!
            this.watched = 0;
            this.watchedAt = null;
            this.magnetHash = null;
        }
        return this.Persist().then(function() {
            if ($rootScope) {
                $rootScope.$broadcast('episode:marked:notdownloaded', this);
                if (watchedDownloadedPaired) {
                    $rootScope.$broadcast('episode:marked:notwatched', this);
                }
            }
            return this;
        }.bind(this));
    },
});


CRUD.define(Fanart, {
    className: 'Fanart',
    table: 'Fanart',
    primary: 'ID_Fanart',
    fields: ['ID_Fanart', 'TVDB_ID', 'poster', 'json'],
    autoSerialize: ['json'],
    relations: {},
    createStatement: 'CREATE TABLE Fanart ( ID_Fanart INTEGER PRIMARY KEY NOT NULL, TVDB_ID INTEGER NOT NULL, poster VARCHAR(255) NULL, json TEXT )',
    adapter: 'dbAdapter',
    indexes: ['TVDB_ID']
}, {

});


CRUD.define(Jackett, {
    className: 'Jackett',
    table: 'Jackett',
    primary: 'ID_Jackett',
    fields: ['ID_Jackett', 'name', 'enabled', 'torznab', 'torznabEnabled', 'apiKey', 'json'],
    relations: {},
    createStatement: 'CREATE TABLE Jackett ( ID_Jackett INTEGER PRIMARY KEY NOT NULL, name VARCHAR(40) DEFAULT(NULL), torznab VARCHAR(200) DEFAULT(NULL), enabled INTEGER DEFAULT(0), torznabEnabled INTEGER DEFAULT(0), apiKey VARCHAR(40) DEFAULT(NULL), json TEXT )',
    adapter: 'dbAdapter',
    migrations: {
        2: [
            'ALTER TABLE Jackett RENAME TO Jackett_bak',
           'CREATE TABLE Jackett ( ID_Jackett INTEGER PRIMARY KEY NOT NULL, name VARCHAR(40) DEFAULT(NULL), torznab VARCHAR(200) DEFAULT(NULL), enabled INTEGER DEFAULT(0), torznabEnabled INTEGER DEFAULT(0), apiKey VARCHAR(40) DEFAULT(NULL), json TEXT )',
            'INSERT OR IGNORE INTO Jackett (ID_Jackett, name, torznab, enabled, torznabEnabled ) select ID_Jackett, name, torznab, enabled, torznabEnabled  from Jackett_bak',
            'DROP TABLE Jackett_bak'
        ]
    }
}, {
    isEnabled: function() {
        return this.enabled && parseInt(this.enabled) == 1;
    },
    setEnabled: function() {
        this.enabled = 1;
        return this.Persist().then(function() {
            return this;
        }.bind(this));
    },
    setDisabled: function() {
        this.enabled = 0;
        return this.Persist().then(function() {
            return this;
        }.bind(this));
    }
});
