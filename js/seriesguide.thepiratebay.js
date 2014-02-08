
angular.module('SeriesGuide.thepiratebay', [])
/**
 * Autofill serie search component
 * Provides autofill proxy and adds the selected serie back to the MainController
 */
.controller('FindTPBTypeAheadCtrl', function ($scope, ThePirateBay) {

  $scope.selected = undefined;
  $scope.find = function(serie) {
  	return ThePirateBay.find(serie).then(function(res) { return res.series; });
  };
  $scope.selectSerie = function(serie) {
  	$scope.selected = serie.name;
  	console.log("Serie selected!", serie);
  }
})
/**
 * ThePirateBay provider
 * Allows searching for any content on tpb, ordered by most seeds
 */
.provider('ThePirateBay', function() {

 this.endpoints = {
 	search: 'http://thepiratebay.se/search/%s/0/7/0',
 	details: 'http://thepiratebay.se/torrent/%s',
 };
 
 /**
  * Switch between search and details
  */
 this.getUrl = function(type, param) {
 		return this.endpoints[type].replace('%s', encodeURIComponent(param));
 },

 /**
  * Get wrapper, providing the actual search functions and result parser
  * Provides promises so it can be used in typeahead as well as in the rest of the app
  */
 this.$get = function($q, $http) {
    var self = this;
    return {
    	/**
    	 * Execute a generic tpb search, parse the results and return them as an array
    	 */
	    search: function(what) {
	    	var d = $q.defer();
	        $http({
	        	method: 'GET',
	            url: self.getUrl('search', what),
	            cache: true
	        }).then(function(response) {
	           d.resolve({result: self.parseSearch(response)});
			}, function(err) {
				console.log('error!');
			  d.reject(err);
			});
			return d.promise;
	    },
	    /**
	     * Fetch details for a specific tpb torrent id
	     */
		torrentDetails: function(id) {
			var d = $q.defer();
			$http({
			  method: 'GET',
			  url: self.getUrl('details', id),
			  cache: true
			}).success(function(response) {
			  d.resolve({result: self.parseDetails(response)});
			}).error(function(err) {
			  d.reject(err);
			});
			return d.promise;
		}
    }
  }
})
.directive('piratebaySearch', function() {

	return {
		restrict: 'E',
		template: ['<div ng-controller="FindTPBTypeAheadCtrl">',
				    '<input type="text" ng-model="selected" placeholder="Search for anything" typeahead-min-length="3" typeahead-loading="loadingTPB"',
				    'typeahead="result for results in find($viewValue) | filter:$viewValue" typeahead-template-url="templates/typeAheadTPB.html"',
				    'typeahead-on-select="selectTPBItem($item)" class="form-control"> <i ng-show="loadingTPB" class="glyphicon glyphicon-refresh"></i>',
				'</div>'].join(' ')
	};
})