/**
 * TheTVDB provider
 * Allows searching for series and get their episode listings
 */
 angular.module('DuckieTV.directives',[])

.directive('serieheader', function () {
  return {
    restrict: 'E',
    scope: { 'serie': '=data', 'noListButton': "=noButton", "noOverview": "=noOverview", "mode":"@" },
    templateUrl: "templates/serieHeader.html"
  }
})

.directive('serieDetails', function(FavoritesService, $location) {
  return {
    restrict: 'E',
    scope: { 'serie': '=serie', 'points': '=points' },
    templateUrl: "templates/serieDetails.html",
    link: function($scope) {

    	$scope.removeFromFavorites = function(serie) {
			console.log("Remove from favorites!", serie);
			FavoritesService.remove(serie);
			$location.path('/');
		}
    }
 }
})


.directive('episodeWatched', function($rootScope, $document) {
	return {
		restrict: 'E',
		scope: { episode: '=' },
		template: ['<a ng-click="markWatched()" class="glyphicon" tooltip="{{tooltip}}" ng-class="{ \'glyphicon-eye-open\' : episode.watched ==  1, \'glyphicon-eye-close\' : episode.watched != 1 }"></a>'],
		link: function ($scope) {

			$scope.tooltip = null; 
			$scope.$watch('episode.watched', function() {
				$scope.tooltip = $scope.episode.watched == 1 ? "You marked this episode as watched at "+new Date($scope.episode.watchedAt).toLocaleString() : "Mark this episode as watched";
			});
			$scope.markWatched = function() {
				$scope.episode.watched = $scope.episode.watched == '1' ? '0' :'1';
				$scope.episode.watchedAt = new Date().getTime();
				
				CRUD.FindOne('Episode', {ID : $scope.episode.ID_Episode}).then(function(epi) {
					
					epi.set('watched', $scope.episode.watched);
					epi.set('watchedAt', $scope.episode.watchedAt);

					epi.Persist();
				});
			}
	      }
	  }
})

/**
 * A <background-rotator channel="'event:channel'"> directive.
 * Usage:
 * Put <background-rotator tag anywhere with a channel parameter
 * directive waits until a new event has been broadcasted with the full url to an image
 * preloads new image
 * Cross-fades between current loaded image and the new image
 */
.directive('backgroundRotator', function($rootScope, $document) {
	return {
		restrict: 'E',
		scope: { channel: '=' },
		template: ["<div ng-style=\"{backgroundImage: bg1 ? 'url('+bg1+')': '',  'transition' : 'opacity 1s ease-in-out', opacity: bg1on ? 1 : 0}\"></div>",
				   "<div ng-style=\"{backgroundImage: bg2 ? 'url('+bg2+')': '',  'transition' : 'opacity 1s ease-in-out', opacity: bg2on ? 1 : 0}\"></div>"].join(''),
		link: function ($scope, $attr) {

			$scope.bg1 = false;
	    	$scope.bg2 = false;
			$scope.bg1on = false;
			$scope.bg2on = false;

			load = function(url) {
			    var img = $document[0].createElement('img');
	            img.onload = function() {
	              var target = $scope.bg1on ? 'bg2' : 'bg1';
	              $scope[target] = img.src;
	              $scope[target+'on'] = true;
	              $scope[(target == 'bg1' ? 'bg2on' : 'bg1on' )] = false;
	              $scope.$digest();
	            };
	            img.onerror= function(e) {
	              console.log("image load error!", e, url);
	            };
	            img.src = url;
			}
	          
	        $rootScope.$on($scope.channel, function(event, url) {
	          load(url);
	        });
	      }
	  }
})