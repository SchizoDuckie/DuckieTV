DuckieTV.controller('traktTvTrendingCtrl', ["$scope", "$filter", "TraktTVTrending", "$state", "FavoritesService",
    function($scope, $filter, TraktTVTrending, $state, FavoritesService) {
        var vm = this;
        vm.results = [];
        vm.filtered = [];
        vm.limit = 75;
        vm.oldLimit = 75;
        vm.activeCategory = false;
        var categories = 'action|adventure|animation|anime|biography|children|comedy|crime|disaster|documentary|drama|eastern|family|fan-film|fantasy|film-noir|food|game-show|history|holiday|home-and-garden|horror|indie|mini-series|music|musical|mystery|news|none|reality|road|romance|science-fiction|short|soap|special-interest|sports|sporting-event|superhero|suspense|talk-show|thriller|travel|tv-movie|war|western'.split('|'); // used by this.translateCategory()
        var translatedCategoryList = $filter('translate')('GENRELIST').split('|');

        FavoritesService.waitForInitialization().then(function() {
            if (FavoritesService.favorites.length == 0) {
                vm.noFavs = true;
            }
        });

        /*
         * enables excluding series already in favourites from trending results
         */
        var alreadyAddedSerieFilter = function(serie) {
            return FavoritesService.favoriteIDs.indexOf(serie.tvdb_id.toString()) === -1;
        }.bind(FavoritesService);

        /*
         * Takes the English Category (as fetched from TraktTV) and returns a translation
         */
        vm.translateCategory = function(category) {
            var idx = categories.indexOf(category);
            return (idx != -1) ? translatedCategoryList[idx] : category;
        };

        vm.getCategories = function() {
            return TraktTVTrending.getCategories();
        };

        vm.toggleCategory = function(category) {
            if (!category || vm.activeCategory == category) {
                vm.activeCategory = false;
                vm.limit = vm.oldLimit;
                TraktTVTrending.getAll().then(function(result) {
                    vm.filtered = result.filter(alreadyAddedSerieFilter);
                });
            } else {
                vm.activeCategory = category;
                vm.filtered = TraktTVTrending.getByCategory(category).filter(alreadyAddedSerieFilter);
                vm.limit = vm.filtered.length;
            }
        };

        vm.getFilteredResults = function() {
            return vm.filtered;
        };

        TraktTVTrending.getAll().then(function(results) {
            vm.filtered = results.filter(alreadyAddedSerieFilter);
        });
    }
]);