angular.module('SeriesGuide.controllers', [])


/**
 * Main controller: Kicks in favorites display
 */
.controller('MainCtrl', 
  function($scope, FavoritesService) {
    $scope.favorites = FavoritesService.favorites;
})

.controller('SerieCtrl',  

	function(TheTVDB, FavoritesService, $routeParams, $scope) {
		console.log('Series controller!', $routeParams.serie, $scope, TheTVDB);
		$scope.episodes = [];
		$scope.serie = FavoritesService.getById($routeParams.id);

		TheTVDB.findEpisodes($routeParams.id).then(function(data) {
			console.log("Found episodes: ", data);
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