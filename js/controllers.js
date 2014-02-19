angular.module('SeriesGuide.controllers', ['ngAnimate'])


/**
 * Main controller: Kicks in favorites display
 */
.controller('MainCtrl', 
  function($scope, FavoritesService) {
  	var favorites = [];

  	/**
  	 * The favorites service fetches data asynchronously via SQLite, we wait for it to emit the favorites:updated event.
  	 */
  	$scope.favorites = FavoritesService.favorites;
  	$scope.$on('favorites:updated', function(event,data) {
	     // you could inspect the data to see if what you care about changed, or just update your own scope
	     console.log('scope favorites changed!', data, $scope);
	     $scope.favorites = data.favorites;
	     $scope.$digest(); // notify the scope that new data came in
   });
  	$scope.$on('episodes:inserted', function(event, serie) {
  		if(serie.get('fanart') != '') {
			var bg = 'url(http://thetvdb.com/banners/'+serie.get('fanart')+')';
			document.body.style.backgroundImage = bg;	
		}
  	});

})

.controller('SerieCtrl',  

	function(TheTVDB, ThePirateBay, FavoritesService, $routeParams, $scope) {
		console.log('Series controller!', $routeParams.serie, $scope, TheTVDB);
		$scope.episodes = [];
		if(FavoritesService.favorites.length > 0) {
			$scope.serie = FavoritesService.getById($routeParams.id);
		}
		$scope.$on('favorites:updated', function(event,favorites) {
			$scope.serie = favorites.getById($routeParams.id);
			console.log("Scope serie found: ", $scope.serie);
			$scope.$digest();
		});
		$scope.searching = false;
		var currentDate = new Date();

		/**
		 * Check if airdate has passed
		 */
		$scope.hasAired = function(serie) {
			return serie.firstaired && new Date(serie.firstaired) <= currentDate;
		};

		$scope.getSearchString = function(serie, episode) {
			
			return serie.name+' '+$scope.getEpisodeNumber(episode);
		};

		$scope.getEpisodeNumber = function(episode) {
			var sn = episode.seasonnumber.toString(), en = episode.episodenumber.toString(), out = ['S', sn.length == 1 ? '0'+sn : sn, 'E', en.length == 1 ? '0'+en : en].join('');
			return out;
		}

		$scope.searchTPB = function(serie, episode) {
			$scope.items = [];
			$scope.searching = true;
			var search = $scope.getSearchString(serie, episode);
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


		FavoritesService.getById($routeParams.id).then(function(serie) {
			$scope.serie = serie.asObject();

			var episodes = FavoritesService.getEpisodes(serie).then(function(data) {
				console.log("Found episodes for seriesview: ", data);
				$scope.episodes = data;
				$scope.$digest();
			}, function(err) {
				debugger;
				console.log("Episodes booh!", err);
			});
			if(serie.get('fanart') != '') {
				var bg = 'url(http://thetvdb.com/banners/'+serie.get('fanart')+')';
				document.body.style.backgroundImage = bg;	
			}
		
		})
		
})


.controller('EpisodeCtrl',  

	function(TheTVDB, ThePirateBay, FavoritesService, NotificationService, $routeParams, $scope) {
		console.log('Episodes controller!', $routeParams.id, $routeParams.episode, $scope, TheTVDB);
		
		$scope.searching = false;
		var currentDate = new Date();

		CRUD.FindOne('Serie', { 'TVDB_ID': $routeParams.id }).then(function(serie) {
			$scope.serie = serie.asObject();
			if(serie.get('fanart') != '') {
				var bg = 'url(http://thetvdb.com/banners/'+serie.get('fanart')+')';
				document.body.style.backgroundImage = bg;	
			}
			serie.Find("Episode", { ID_Episode: $routeParams.episode}).then(function(epi) {
						$scope.episode = epi[0].asObject();
						$scope.$digest();
					}, function(err) {
						debugger;
						console.log("Episodes booh!", err);
				});
		}, function(err) { debugger; })


		/**
		 * Check if airdate has passed
		 */
		$scope.hasAired = function(serie) {
			return serie.firstaired && new Date(serie.firstaired) <= currentDate;
		};

		$scope.getSearchString = function(serie, episode) {
			
			return serie.name+' '+$scope.getEpisodeNumber(episode);
		};

		$scope.getEpisodeNumber = function(episode) {
			var sn = episode.seasonnumber.toString(), en = episode.episodenumber.toString(), out = ['S', sn.length == 1 ? '0'+sn : sn, 'E', en.length == 1 ? '0'+en : en].join('');
			return out;
		}

		$scope.searchTPB = function(serie, episode) {
			$scope.items = [];
			$scope.searching = true;
			var search = $scope.getSearchString(serie, episode);
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

		$scope.notify = function(serie) {
			NotificationService.notify('test', 'woei');

			NotificationService.list('SeriesGuide Chrome', 'ohai', [
				{message: 'S02E14 - Time Of Death',title: 'Arrow'},
				{ message: 'S02E10 - Blast Radius', title: 'Arrow'},
				{ message: 'S02E09 - Three Ghosts', title: 'Arrow'},
				{ message: 'S02E07 - State v. Queen', title: 'Arrow'}, 
				{ message: 'S01E05 - Girl in the Flower Dress', title: 'Marvel\'s Agents of S.H.I.E.L.D'}])
		}
		
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