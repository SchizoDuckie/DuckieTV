angular.module('SeriesGuide.thetvdb',[])
.provider('TheTVDB', function() {

 this.endpoints = {
 	seriesSearch: 'http://thetvdb.com/api/GetSeries.php?seriesname=%s',
 	episodeSearch: 'http://thetvdb.com/api/646990DA07A98A2B/series/%s/all/en.xml'
 };
 
 this.getUrl = function(type, seriesname) {
 		return this.endpoints[type+'Search'].replace('%s', encodeURIComponent(seriesname));
 },

 this.parseEpisodes = function(data) {
        var curDate = new Date().getTime();
        var epis = angular.element(data).find("Episode");
        var data = [];
        for (var i = epis.length - 1; i > 0; i--) {
        	var episode = angular.element(epis[i]);
        	var sn = episode.find("SeasonNumber").text();
            var en = episode.find("EpisodeNumber").text();
            var airdate = episode.find("FirstAired").text()
            data.push({
                season: (sn.length == 1) ? "0" + sn : sn,
                episode: (en.length == 1) ? "0" + en : en,
                episodename: episode.find("EpisodeName").text(),
                firstaired: airdate != '' ? new Date(airdate) : '',
                magnet: false
            });
        }
        console.log('Found episodes: ', data);
        return data;
 }
    
 this.parseSeries = function(data) {
	   var searchresults = [];
    	var series = data.xml.find('Series'); 
    	for(var i =0; i<series.length; i++) {
    		var serie = angular.element(series[i]);
	    	 var banner = serie.find('banner').text();
				searchresults.push({
	                id: serie.find("id").text(),
	                escaped:serie.find("SeriesName").text().replace(/\'/g, "\'"),
	                banner: banner !== '' ? "http://thetvdb.com/banners/" + banner : "",
	                name: serie.find("SeriesName").text(),
	                overview: serie.find("Overview").text()
	            });
	    	}
    	console.log(searchresults);
    	return searchresults;
	}


 this.$get = function($q, $http) {
    var self = this;
    return {
	    findSeries: function(name) {
	    	var d = $q.defer();
	        $http({
	        	method: 'GET',
	            url: self.getUrl('series', name),
	            cache: true
	          }).then(function(response) {
	           d.resolve({series: self.parseSeries(response)});
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
			  d.resolve({episodes: self.parseEpisodes(response)});
			}).error(function(err) {
			  d.reject(err);
			});
			return d.promise;
		}
    }
  }
})

/**
 * Autofill serie search component
 * Provides autofill proxy and adds the selected serie back to the MainController
 */
.controller('FindSeriesTypeAheadCtrl', function ($scope, TheTVDB, FavoritesService) {

  $scope.selected = undefined;
  $scope.findSeries = function(serie) {
  	return TheTVDB.findSeries(serie).then(function(res) { return res.series; });
  };
  $scope.selectSerie = function(serie) {
  	$scope.selected = serie.name;
  	console.log("Serie selected!", serie);
  	FavoritesService.addFavorite(serie);
  }
})

/**
 * <the-tv-db-search>
 */
.directive('theTvDbSearch', function() {

	return {
		restrict: 'E',
		template: ['<div ng-controller="FindSeriesTypeAheadCtrl">',
			        '<input type="text" ng-model="selected" placeholder="Type a series name to add to your favorites"',
          			'typeahead-min-length="3" typeahead-loading="loadingSeries"',
          			'typeahead="serie for series in findSeries($viewValue) | filter:$viewValue" typeahead-template-url="templates/typeAheadSeries.html"', 
          			'typeahead-on-select="selectSerie($item)" class="form-control"> <i ng-show="loadingTPB" class="glyphicon glyphicon-refresh"></i>',
		        '</div>'].join(' ')
	};
})