var Serie = CRUD.define({
		className: 'Serie',
		table : 'Series',
		primary : 'ID_Serie',
		fields: ['ID_Serie','name','banner', 'overview','TVDB_ID','TVRage_ID', 'IMDB_ID'],
		relations: {
			'Episode': CRUD.RELATION_FOREIGN
		},
		createStatement: 'CREATE TABLE "Series" ("ID_Serie" INTEGER PRIMARY KEY  NOT NULL ,"name" varchar(256) DEFAULT (NULL), "banner" varchar(1024) DEFAULT (NULL), "overview" TEXT DEFAULT (NULL), "TVDB_ID" INTEGER NOT NULL, "TVRage_ID" INTEGER DEFAULT (NULL), "IMDB_ID" INTEGER DEFAULT (NULL))',
		adapter: 'dbAdapter',
		defaultValues: {
			
		},

		fixtures: [
			{ 
			  name: 'Person of Interest',
			  overview : 'Person of Interest is an American crime drama television series broadcasting on CBS. It is based on a screenplay developed by Jonathan Nolan. The series revolves around a former CIA officer (Jim Caviezel) recruited by a mysterious billionaire (Michael Emerson) to prevent violent crimes in New York City.',
			  'TVDB_ID': 248742,
			  banner: 'http://thetvdb.com/banners/graphical/248742-g5.jpg'
			}
		]

	}, { 
	});

	