angular.module('DuckieTV.controllers',['DuckieTV.settingssync'])


/**
 * Main controller: Kicks in favorites display
 */
.controller('MainCtrl', 
  function($scope, $rootScope, FavoritesService) {
  	var favorites = [];
  	$scope.searchEngine = 1;
  	$scope.searchingForSerie = false;
  	$scope.mode = $rootScope.getSetting('series.displaymode');
  	
  	$scope.setMode = function(mode) {
  		$rootScope.setSetting('series.displaymode', mode);
  		$scope.mode = mode;
  	}

  	$scope.enableAdd = function() {
  		$scope.searchingForSerie = true;
  	}

  	$scope.disableAdd = function() {
	  	$scope.searchingForSerie = false;
	  	console.log("Disable!");
	}

  	/**
  	 * The favorites service fetches data asynchronously via SQLite, we wait for it to emit the favorites:updated event.
  	 */
  	$scope.favorites = FavoritesService.favorites;
  	$scope.$on('favorites:updated', function(event,data) {
	     // you could inspect the data to see if what you care about changed, or just update your own scope
	     $scope.favorites = data.favorites;
	     if(!$scope.favorites || (data.favorites && data.favorites.length == 0)) {
	     	$scope.enableAdd();
	     } else {
		     var serie = data.favorites[Math.floor(Math.random() * data.favorites.length)];
		     $rootScope.$broadcast('background:load', 'http://thetvdb.com/banners/'+serie.fanart);	
	     }
	     $scope.$digest(); // notify the scope that new data came in
   	});
  	$scope.$on('episodes:inserted', function(event, serie) {
  		if(serie.get('fanart') != '') {
		 $rootScope.$broadcast('background:load', 'http://thetvdb.com/banners/'+serie.get('fanart'));
		}
  	});
})

.controller('SerieCtrl',  

	function(TheTVDB, ThePirateBay, FavoritesService, SettingsService, SceneNameResolver, TVRageSyncService, $routeParams, $scope, $rootScope, $injector) {
		console.log('Series controller!', $routeParams.serie, $scope, TheTVDB);
		$scope.episodes = [];

		$scope.markingAsWatched = false;
		$scope.markUntilDate = false;

		if(FavoritesService.favorites.length > 0) {
			$scope.serie = FavoritesService.getById($routeParams.id);
		}
		$scope.$on('favorites:updated', function(event,favorites) {
			$scope.serie = favorites.getById($routeParams.id);
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

		$scope.markRange = function(episode) {
			if(!$scope.markingAsWatched) return;
			$scope.markUntilDate = new Date(episode.firstaired)
			$scope.markingAsWatched = false;
			for(var i=0; i<$scope.episodes.length; i++) {
				if($scope.episodes[i].firstaired != '' && new Date($scope.episodes[i].firstaired) <= $scope.markUntilDate) {
					$scope.episodes[i].watched = '1';
					$scope.episodes[i].watchedAt = new Date();

					CRUD.FindOne('Episode', {ID : $scope.episodes[i].ID_Episode}).then(function(epi) {
						epi.set('watched', 1);
						epi.set('watchedAt', new Date());
						epi.Persist();
					});
					
				}
			}
		}

		$scope.setMarkEnd = function(episode) {
			$scope.markUntilDate = new Date(episode.firstaired);
		}

		$scope.isMarkBeforeEnd = function(episode) {
			return $scope.markingAsWatched && $scope.markUntilDate >= new Date(episode.firstaired);
		}

		$scope.stopMarkingAsWatched = function() {
			$scope.markingAsWatched = false;
		}

		$scope.getSearchString = function(serie, episode) {
			var serieName = SceneNameResolver.getSceneName(serie.TVDB_ID) || serie.name;
			return serieName +' '+$scope.getEpisodeNumber(episode)+' '+SettingsService.get('torrenting.searchquality');
		}

		$scope.getEpisodeNumber = function(episode) {
			var sn = episode.seasonnumber.toString(), en = episode.episodenumber.toString(), out = ['S', sn.length == 1 ? '0'+sn : sn, 'E', en.length == 1 ? '0'+en : en].join('');
			return out;
		}

		$scope.tvRageSync = function(serie, episodes) {
			TVRageSyncService.syncEpisodes(serie, episodes);
		}

		$scope.searchTorrents = function(serie, episode) {
			$scope.items = [];
			$scope.searching = true;
			var search = $scope.getSearchString(serie, episode);
			console.log("Search: ", search);
				$injector.get($scope.getSetting('torrenting.searchprovider')).search(search).then(function(results) {
			 	$scope.items = results;
			 	$scope.searching = false;
			 	console.log('Added episodes: ', $scope);
			 }, function(e) { 
			 	console.error("TPB search failed!"); 
			 	$scope.searching = false; 
			 });
		}

		$scope.markRangeWatchedStart = function() {
			$scope.markingAsWatched = true;
		}


		FavoritesService.getById($routeParams.id).then(function(serie) {
			$scope.serie = serie.asObject();

			var episodes = FavoritesService.getEpisodes(serie).then(function(data) {
				$scope.episodes = data;
				$scope.$digest();
			}, function(err) {
				debugger;
				console.log("Episodes booh!", err);
			});
			if(serie.get('fanart') != '') {
				 $rootScope.$broadcast('background:load', 'http://thetvdb.com/banners/'+serie.get('fanart'));
			}
		
		})
		
})



.controller('WatchlistCtrl',  function($scope, WatchlistService) {
	$scope.watchlist = WatchlistService.watchlist;
  	$scope.searchEngine = 1;
  	$scope.searchingForMovie = false;

  	$scope.enableAdd = function() {
  		$scope.searchingForMovie = true;
  	}

  	$scope.disableAdd = function() {
	  	$scope.searchingForMovie = false;
	  	console.log("Disable!");
    }

    $scope.$on('watchlist:updated', function(event,data) {
	     // you could inspect the data to see if what you care about changed, or just update your own scope
	     $scope.watchlist = data;
	     console.log("Watchlist came in!", $scope.watchlist, data);
	     if(!$scope.watchlist || (data.watchlist && data.watchlist.length == 0)) {
	     	$scope.enableAdd();
	     } 
	     $scope.$digest(); // notify the scope that new data came in
   	});
  	

})

.controller('EpisodeCtrl',  

	function(TheTVDB, ThePirateBay, SettingsService, FavoritesService, SceneNameResolver, NotificationService, $routeParams, $scope, $rootScope) {
		
		$scope.searching = false;
		var currentDate = new Date();

		CRUD.FindOne('Serie', { 'TVDB_ID': $routeParams.id }).then(function(serie) {
			$scope.serie = serie.asObject();
			if(serie.get('fanart') != '') {
				 $rootScope.$broadcast('background:load', 'http://thetvdb.com/banners/'+serie.get('fanart'));
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
			var serieName = SceneNameResolver.getSceneName(serie.name) || serie.name;
			return serieName +' '+$scope.getEpisodeNumber(episode)+' '+SettingsService.get('torrenting.searchquality');
		};

		$scope.getEpisodeNumber = function(episode) {
			var sn = episode.seasonnumber.toString(), en = episode.episodenumber.toString(), out = ['S', sn.length == 1 ? '0'+sn : sn, 'E', en.length == 1 ? '0'+en : en].join('');
			return out;
		}

		$scope.searchTorrents = function(serie, episode) {
			$scope.items = [];
			$scope.searching = true;
			var search = $scope.getSearchString(serie, episode);
			 ThePirateBay.search(search).then(function(results) {
			 	$scope.items = results;
			 	$scope.searching = false;
			 }, function(e) { 
			 	console.error("TPB search failed!"); 
			 	$scope.searching = false; 
			 });
		}

		$scope.notify = function(serie) {
			NotificationService.notify('test', 'woei');

			NotificationService.list('DuckieTV Chrome', 'ohai', [
				{message: 'S02E14 - Time Of Death',title: 'Arrow'},
				{ message: 'S02E10 - Blast Radius', title: 'Arrow'},
				{ message: 'S02E09 - Three Ghosts', title: 'Arrow'},
				{ message: 'S02E07 - State v. Queen', title: 'Arrow'}, 
				{ message: 'S01E05 - Girl in the Flower Dress', title: 'Marvel\'s Agents of S.H.I.E.L.D'}])
		}
		
})


.controller('SettingsCtrl', 
  function($scope, $location, $rootScope, FavoritesService, SettingsService, MirrorResolver, StorageSyncService) {
    
    $scope.custommirror = SettingsService.get('thepiratebay.mirror');
    $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
    $scope.searchquality = SettingsService.get('torrenting.searchquality');
    $scope.mirrorStatus = [];
    $scope.hasTopSites = ('topSites' in window.chrome);

    $rootScope.$on('mirrorresolver:status', function(evt, status) {
    	$scope.mirrorStatus.unshift(status);
    });


    $scope.sync = function() {
    	console.log("Synchronizging!");
    	StorageSyncService.synchronize();
    }

    $scope.setSearchProvider = function(provider) {
    	$scope.searchprovider = provider;
    	SettingsService.set('torrenting.searchprovider', provider);
    }

  	$scope.setSearchQuality = function(quality) {
  		console.log("Setting searchquality: ", quality);
		$rootScope.setSetting('torrenting.searchquality',quality);
  		$scope.searchquality = quality;
  	}

	$scope.findRandomTPBMirror = function() {
		MirrorResolver.findTPBMirror().then(function(result) {
			$scope.custommirror = result;
			SettingsService.set('thepiratebay.mirror', $scope.custommirror);
			$rootScope.$broadcast('mirrorresolver:status','Saved!');
		}, function(err) {
			console.debug("Could not find a working TPB mirror!", err);
		})
	}

	$scope.validateCustomMirror = function(mirror) {
		$scope.mirrorStatus = [];
		MirrorResolver.verifyMirror(mirror).then(function(result) {
			$scope.custommirror = result;
			SettingsService.set('thepiratebay.mirror', $scope.custommirror);
			$rootScope.$broadcast('mirrorresolver:status','Saved!');
		}, function(err) {
			console.log("Could not validate custom mirror!",mirror);
			//$scope.customMirror = '';
		})
	}


    $scope.favorites = FavoritesService.favorites;
  	$scope.$on('favorites:updated', function(event,data) {
	     // you could inspect the data to see if what you care about changed, or just update your own scope
	     if(data.favorites && data.favorites.length > 0) {
		     var serie = data.favorites[Math.floor(Math.random() * data.favorites.length)];
		     $rootScope.$broadcast('background:load', 'http://thetvdb.com/banners/'+serie.fanart);	
	     }
	     $scope.$digest(); // notify the scope that new data came in
   	});

});