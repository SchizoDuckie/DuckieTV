angular.module('SeriesGuide.imdb',[])
/**
 * Standalone IMDB search capabilities.
 * Provides IMDB api search results
 * and the <imdb-search> tag with autocomplete.
 */

.provider('IMDB', function() {

 this.endpoints = {
 	search: 'http://www.imdb.com/find?q=%s&s=tt&ref_=fn_al_tt_mr',
 };
 
 this.getUrl = function(type, query) {
 		return this.endpoints[type].replace('%s', encodeURIComponent(query));
 },

 this.parseSearch = function(result) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(result.data, "text/html");
  var results = doc.querySelectorAll("table.findList tr.findResult");
  var output = [];
  var max = results.length > 20 ? 20 : results.length;
  for(var i=0; i<max;i++) {
        var link = results[i].querySelector('td:nth-child(2) a');
        if(!link ) {
          continue;
        }
        var title = link.innerText
         var parent = link.parentNode;
         parent.removeChild(link);
         var extra = parent.innerText;
    output.push({
      image: results[i].querySelector('td a img').src,
      title: title,
      IMDB_ID: results[i].innerHTML,
      extra: extra,
      cell : results[i].innerHTML
    })
  }
  console.log("parsed: ", output);
  return output;
 }


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
	          	d.resolve(self.parseSearch(response));
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
.controller('FindIMDBTypeAheadCtrl', function ($scope, IMDB, WatchlistService) {

  $scope.selected = undefined;
  /**
   * Perform search and concat the interesting results when we find them.
   * Imdb api sends 3 some array keys based on exact, popular and substring results.
   * We include only the first 2 for the autocomplete.
   */
  $scope.find = function(what) {
  	return IMDB.findAnything(what).then(function(res) { 
  		
  	    return res;
  	});
  };

  /**
   * Handle imdb click. 
   * @Todo figure out what to do with this. popover? new tab?
   */
  $scope.selectIMDB = function(item) {
  	$scope.selected = item;
  	console.log("IMDB Item selected!", item);
    WatchlistService.add(item);
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
          			'typeahead="result for results in find($viewValue)  | filter: orderBy: \'title\'" typeahead-template-url="templates/typeAheadIMDB.html"', 
          			'typeahead-on-select="selectIMDB($item)" class="form-control"> <i ng-show="loadingIMDB" class="glyphicon glyphicon-refresh"></i>',
		        '</div>'].join(' ')
	};
});