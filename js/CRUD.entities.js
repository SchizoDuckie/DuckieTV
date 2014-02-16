var Serie = CRUD.define({
 		className: 'Serie',
		table : 'Series',
		primary : 'ID_Serie',
		fields: ['ID_Serie', 'name', 'banner', 'overview', 'TVDB_ID', 'IMDB_ID', 'TVRage_ID', 'networkid', 'seriesid', 'zap2it_id', 'actors', 'airs_dayofweek', 'airs_time', 'contentrating', 'firstaired', 'genre', 'language', 'network', 'rating', 'ratingcount', 'runtime', 'status', 'added', 'addedby', 'fanart', 'poster', 'lastupdated', 'lastfetched', 'nextupdate'],
		relations: {
			'Episode': CRUD.RELATION_FOREIGN
		},
		createStatement: 'CREATE TABLE "Series" ("ID_Serie" INTEGER PRIMARY KEY NOT NULL,  "name" VARCHAR(250) DEFAULT(NULL),  "banner" VARCHAR(1024) DEFAULT(NULL),  "overview" TEXT DEFAULT(NULL),  "TVDB_ID" INTEGER UNIQUE NOT NULL,  "IMDB_ID" INTEGER NULL,  "TVRage_ID" INTEGER NULL,  "networkid" VARCHAR(50) DEFAULT(NULL),  "seriesid" VARCHAR(50) DEFAULT(NULL),  "zap2it_id" VARCHAR(50) DEFAULT(NULL),  "actors" VARCHAR(1024) DEFAULT(NULL),  "airs_dayofweek" VARCHAR(10) DEFAULT(NULL),  "airs_time" VARCHAR(15) DEFAULT(NULL),  "contentrating" VARCHAR(20) DEFAULT(NULL),  "firstaired" DATE DEFAULT(NULL),  "genre" VARCHAR(50) DEFAULT(NULL),  "language" VARCHAR(50) DEFAULT(NULL),  "network" VARCHAR(50) DEFAULT(NULL),  "rating" VARCHAR(10) DEFAULT(NULL),  "ratingcount" VARCHAR(10) DEFAULT(NULL),  "runtime" VARCHAR(50) DEFAULT(NULL),  "status" VARCHAR(50) DEFAULT(NULL),  "added" DATE DEFAULT(NULL),  "addedby" VARCHAR(50) DEFAULT(NULL),  "fanart" VARCHAR(150) DEFAULT(NULL),  "poster" VARCHAR(150) DEFAULT(NULL),  "lastupdated" TIMESTAMP DEFAULT (NULL),  "lastfetched" TIMESTAMP DEFAULT (NULL),  "nextupdate" TIMESTAMP DEFAULT (NULL) )',
		adapter: 'dbAdapter',
		defaultValues: {
			
		},
		fixtures: [
			
		]

	}, { 

		getEpisodes: function() {
			console.log("Fetching episodes for ", this);
			return this.Find('Episode', {}).then(function(res) {
				console.log("Found episodes! ", res);
				return res;
			}, function(err) {
				console.log("GETEPISODES ERROR!", err);
			})
		}
	});


var Episode = CRUD.define({
		className: 'Episode',
		table : 'Episodes',
		primary : 'ID_Episode',
		fields: ['ID_Episode','ID_Serie','TVDB_ID','director','episodename','episodenumber','firstaired','gueststars','imdb_id','language','overview','rating','ratingcount','seasonnumber','writer','filename','lastupdated','seasonid','seriesid','lastchecked'],
		relations: {
			'Serie': CRUD.RELATION_FOREIGN
		},
		createStatement: 'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL,TVDB_ID INTEGER NOT NULL,Director VARCHAR(255), episodename VARCHAR(255), episodenumber INTEGER , firstaired DATE , gueststars VARCHAR(255), imdb_id VARCHAR(20), language VARCHAR(3), overview TEXT , rating VARCHAR(5), ratingcount INTEGER NULL , seasonnumber INTEGER NULL , writer VARCHAR(100) , filename VARCHAR(255) , lastupdated TIMESTAMP , seasonid INTEGER NULL , seriesid INTEGER NULL , lastchecked TIMESTAMP NULL )',
		adapter: 'dbAdapter',
		defaultValues: {
			
		},
		fixtures: [
			
		]
	}, { 

		getFormattedEpisode: function() {
			var sn = this.get('seasonnumber').toString(), en = this.get('episodenumber').toString(), out = ['S', sn.length == 1 ? '0'+sn : sn, 'E', en.length == 1 ? '0'+en : en].join('');
			return out;
		}
	});

	
// watchlist (movie, imdb id, trailer, lastchecked)



CRUD.setAdapter(new CRUD.SQLiteAdapter('seriesguide_chrome'));