angular.module('DuckieTV.trakttv',[])
.provider('TraktTV', function() {
	 this.http = null;
	 this.promise = null;

	 this.endpoints = {
	 	seriesSearch: 'http://api.trakt.tv/search/shows.json/32e05d4138adb5da5b702b362bd21c52?query=%s',
	 	seasonSearch: 'http://api.trakt.tv/show/seasons.json/32e05d4138adb5da5b702b362bd21c52/%s',
	 	episodeSearch: 'http://api.trakt.tv/show/season.json/32e05d4138adb5da5b702b362bd21c52/%s/%s'
	 };

	 this.parsers = {
	 	 season: function(data) {
		       return data.data;
		 },

		 episode: function(data) {
		 	console.log("Parsed episodes!", data.data);
		    return data.data;
		 },
		    
		 search: function(data) {
		 		
		 }
	 };
	 
	 this.getUrl = function(type, param, param2) {
	 	var out = this.endpoints[type+'Search'].replace('%s', encodeURIComponent(param));
	 	return (param2 !== undefined) ? out.replace('%s', encodeURIComponent(param2)) : out;
	 };

	 this.getParser = function(type) {
	 	return this.parsers[type];
	 }

	this.promiseRequest = function(type, param, param2) {
	 	var d = this.promise.defer();
	 	var url = this.getUrl(type, param, param2);
	 	var parser = this.getParser(type);
	    this.http({
	    	method: 'GET',
	        url: url,
	        cache: true
	      }).then(function(response) {
	       d.resolve(parser(response));
		}, function(err) {
			console.log('error fetching', type);
		  	d.reject(err);
		});
		return d.promise;
	}


 this.$get = function($q, $http) {
    var self = this;
    self.http = $http;
    self.promise = $q;
    return {
    	findSeriesByID: function(TVDB_ID) {
    		var d = self.promise.defer();
    		self.promiseRequest('season', TVDB_ID).then(function(seasons) {
    			console.log("Found seasons from trak.tv!", seasons);
    			$q.all(seasons.map(function(season) {
					return self.promiseRequest('episode', TVDB_ID, season.season);
    			})).then(function(result) {
    				console.log("All results came in!", result);
    				d.resolve(result);
    			});
    			
    		});
    		return d.promise;
    	}
    }
  }
});
