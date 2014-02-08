angular.module('SeriesGuide.imdb',[])
/**
 * Standalone IMDB search capabilities.
 * Provides IMDB api search results
 * and the <imdb-search> tag with autocomplete.
 */

.provider('IMDB', function() {

 this.endpoints = {
 	search: 'http://www.imdb.com/xml/find?json=1&nr=1&tt=on&q=%s',
 };
 
 this.getUrl = function(type, query) {
 		return this.endpoints[type].replace('%s', encodeURIComponent(query));
 },

 this.$get = function($q, $http) {
    var self = this;
    return {
	    findAnything: function(what) {
	    	var d = $q.defer();
	        $http({
	        	method: 'GET',
	            url: self.getUrl('search', what),
	            cache: true
	          }).then(function(response) {
	          	d.resolve(response);
			}, function(err) {
				console.log('error!');
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
.controller('FindIMDBTypeAheadCtrl', function ($scope, IMDB) {

  $scope.selected = undefined;
  /**
   * Perform search and concat the interesting results when we find them.
   * Imdb api sends 3 some array keys based on exact, popular and substring results.
   * We include only the first 2 for the autocomplete.
   */
  $scope.find = function(what) {
  	return IMDB.findAnything(what).then(function(res) { 
  		var results = [];
  		if('title_exact' in res.data) {
  			results = results.concat(res.data.title_exact);
  		}
  		if('title_popular' in res.data) {
  			results = results.concat(res.data.title_popular);
  		}
  	    return results;
  	});
  };

  /**
   * Handle imdb click. 
   * @Todo figure out what to do with this. popover? new tab?
   */
  $scope.selectIMDB = function(item) {
  	$scope.selected = item;
  	console.log("IMDB Item selected!", item);
  }
})

/**
 * <the-tv-db-search>
 */
.directive('imdbSearch', function() {

	return {
		restrict: 'E',
		template: ['<div ng-controller="FindIMDBTypeAheadCtrl">',
			        '<input type="text" ng-model="selected" placeholder="Search IMDB for movies or series"',
          			'typeahead-min-length="3" typeahead-loading="loadingIMDB"',
          			'typeahead="result for results in find($viewValue)  | orderBy: \'title\'" typeahead-template-url="templates/typeAheadIMDB.html"', 
          			'typeahead-on-select="selectIMDB($item)" class="form-control"> <i ng-show="loadingIMDB" class="glyphicon glyphicon-refresh"></i>',
		        '</div>'].join(' ')
	};
});