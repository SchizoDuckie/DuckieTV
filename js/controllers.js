angular.module('SeriesGuide.controllers', [])


/**
 * Main controller: Kicks in favorites display
 */
.controller('MainCtrl', 
  function($scope, FavoritesService) {
    $scope.favorites = FavoritesService.favorites;
})

.controller('SerieCtrl',  

	function(TheTVDB, ThePirateBay, FavoritesService, $routeParams, $scope) {
		console.log('Series controller!', $routeParams.serie, $scope, TheTVDB);
		$scope.episodes = [];
		$scope.serie = FavoritesService.getById($routeParams.id);
		$scope.searching = false;
		var currentDate = new Date();

		/**
		 * Check if airdate has passed
		 */
		$scope.hasAired = function(serie) {
			return serie.firstaired && serie.firstaired <= currentDate;
		};

		$scope.searchTPB = function(serie, episode) {
			$scope.items = [];
			$scope.searching = true;
			var search = "%s S%sE%s".replace('%s', serie.name).replace('%s', episode.season).replace('%s', episode.episode);
			console.log("Search: ", search);
			 ThePirateBay.search(search).then(function(results) {
			 	$scope.items = results;
			 	$scope.searching = false;
			 	console.log('Added episodes: ', $scope);
			 }, function(e) { 
			 	console.error("TPB search failed!"); 
			 	$scope.searching = false; 
			 });
		}

		TheTVDB.findEpisodes($routeParams.id).then(function(data) {
			console.log("Found episodes: ", data);
			for(var i=0; i<data.episodes; i++) {
				data.episodes[i].items = [];
			}
			$scope.episodes = data.episodes;
		}, function(err) {
			console.log("Episodes booh!", err);
	});
})


.controller('SettingsCtrl', 
  function($scope, $location, UserService) {
    $scope.user = UserService.user;

    $scope.save = function() {
      UserService.save();
      $location.path('/');
    }
    //$scope.fetchCities = Weather.getCityDetails;
});