angular.module('Chrome.topSites',[])
/**
 * Standalone Chrome Top Site list generator.
 * Provides the <chrome-top-sites> directive
 * That displays your most visited sites
 */

.provider('ChromeTopSites', function() {
   
 this.$get = function($q) {
     return {
	    getTopSites: function() {
        var p = $q.defer();
         chrome.topSites.get(function(result) {
            console.log("Topsites result just came in ", result);
            p.resolve(result);
         });
         return p.promise;  
	    }
    }
  }
})

.controller('ChromeTopSitesCtrl', function ($scope, ChromeTopSites) {

  $scope.topSites = [];
  
  ChromeTopSites.getTopSites().then(function(result) {
    $scope.topSites = result;
  });
})


/**
 * <chrome-top-sites> directive that shows the list
 */
.directive('chromeTopSites', function() {

	return {
		restrict: 'E',
		template: ['<div ng-controller="ChromeTopSitesCtrl" class="topSites">',
			        '<ul>',
          			'<li ng-animate="\'animate\'" ng-repeat="site in topSites | limitTo: 6">',
                  '<a href="{{ site.url }}">',
                    '<img src="http://api.webthumbnail.org/?width=200&height=200&screen=1024&url={{site.url}}">',
                    '<p>{{ site.title }}</p>',
                   '</a>',
                  '</li>',
                '</ul>',
              '</div>'].join(' ')
	};
});