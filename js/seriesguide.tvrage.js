angular.module('SeriesGuide.tvrage',[])
.provider('TVRage', function() {

 this.endpoints = {
 	seriesSearch: 'http://services.tvrage.com/feeds/episodeinfo.php?key=1zWislSnXYQL8WERM3c2&show=%s&exact=1',
 	episodeSearch: 'http://services.tvrage.com/myfeeds/episode_list.php?key=1zWislSnXYQL8WERM3c2&sid=%s'
 };
 
 this.getUrl = function(type, seriesname) {
 		return this.endpoints[type+'Search'].replace('%s', encodeURIComponent(seriesname));
 },

 this.parseEpisodes = function(data) {
        var curDate = new Date().getTime();
        var out = [];
        var seasons = angular.element(data).find('Season'); 

    	for(var j = 0; j<seasons.length; j++) { 
    		var sn = seasons[j].getAttribute("no");
    		if(sn.length == 1) sn = ['0',sn].join('');

    		var epis = angular.element(seasons[j]).find("episode");
    		 for (var i = epis.length - 1; i > 0; i--) {
	        	var episode = angular.element(epis[i]);
	        	var en = episode.find("seasonnum").text();
	            if(en.length == 1) en =  '0'+en.toString();
	            var airdate = episode.find("airdate").text()
	            var title = episode.find("title").text();
	            out.push({
	            	season: sn,
	            	episode: en,
	            	airdate: airdate,
	            	title: title
	            })
	        }
    	}
        return out;
 }
    
 this.parseSeries = function(data) {
	   var searchresults = [];
    	var show = angular.element(typeof(data) == 'string' ? data: data.xml).find('show');  // to accomodate parsing series from within episode search as well
    	return show[0].getAttribute('id');
 }


 this.$get = function($q, $http) {
    var self = this;
    return {
	    findSeriesID: function(name) {
	    	var d = $q.defer();
	        $http({
	        	method: 'GET',
	            url: self.getUrl('series', name),
	            cache: true
	          }).then(function(response) {
	           d.resolve( self.parseSeries(response));
			}, function(err) {
				console.log('error!');
			  d.reject(err);
			});
			return d.promise;
	    },
		findEpisodes: function(seriesID) {
			var d = $q.defer();
			$http({
			  method: 'GET',
			  url: self.getUrl('episode', seriesID),
			  cache: true
			}).success(function(response) {
			  d.resolve(self.parseEpisodes(response));
			}).error(function(err) {
			  d.reject(err);
			});
			return d.promise;
		}
    }
  }
});
