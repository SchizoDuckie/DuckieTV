var Serie = CRUD.define({
	/*
 id: 248742
 Actors: |Jim Caviezel|Michael Emerson|Sarah Shahi|Kevin Chapman|Taraji P. Henson|Enrico Colantoni|Brett Cullen|Amy Acker|
 Airs_DayOfWeek: Tuesday
 Airs_Time: 10:00 PM
 ContentRating: TV-14
 FirstAired: 2011-09-22
 Genre: |Action|Adventure|Drama|Mystery|
 IMDB_ID: tt1839578
 Language: en
 Network: CBS
 NetworkID: 
 Overview: Person of Interest is an American crime drama television series broadcasting on CBS. It is based on a screenplay developed by Jonathan Nolan. The series revolves around a former CIA officer (Jim Caviezel) recruited by a mysterious billionaire (Michael Emerson) to prevent violent crimes in New York City.
 Rating: 8.9
 RatingCount: 168
 Runtime: 60
 SeriesID: 80967
 SeriesName: Person of Interest
 Status: Continuing
 added: 2011-05-14 07:42:59
 addedBy: 235881
 banner: graphical/248742-g5.jpg
 fanart: fanart/original/248742-14.jpg
 lastupdated: 1392155177
 poster: posters/248742-7.jpg
 zap2it_id: EP01419847
  */
		className: 'Serie',
		table : 'Series',
		primary : 'ID_Serie',
		fields: ['ID_Serie','name','banner', 'overview','TVDB_ID','TVRage_ID', 'IMDB_ID'],
		relations: {
			'Episode': CRUD.RELATION_FOREIGN
		},
		createStatement: 'CREATE TABLE "Series" ("ID_Serie" INTEGER PRIMARY KEY  NOT NULL ,"name" varchar(256) DEFAULT (NULL), "banner" varchar(1024) DEFAULT (NULL), "overview" TEXT DEFAULT (NULL), "TVDB_ID" INTEGER UNIQUE NOT NULL, "TVRage_ID" INTEGER DEFAULT (NULL), "IMDB_ID" INTEGER DEFAULT (NULL))',
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
			
			var sn = this.get('seasonnumber').toString(), en = this.get('episodenumber').toString();
			var out = ['S', ((sn.length == 1) ? '0'+sn : sn), 'E', ((en.length == 1) ? '0'+en : en)].join('');
			 console.log("Formatted episode!", out);
			 return out;
		}
	});

	
// watchlist (movie, imdb id, trailer, lastchecked)



CRUD.setAdapter(new CRUD.SQLiteAdapter('seriesguide2'));