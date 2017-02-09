DuckieTV.controller('traktTvTrendingCtrl', ["$scope", "$filter", "TraktTVTrending", "$state", "FavoritesService", "$rootScope",
    function($scope, $filter, TraktTVTrending, $state, FavoritesService, $rootScope) {
        var trending = this;
        this.results = [];
        this.filtered = [];
        this.limit = 75;
        this.oldLimit = 75;
        this.activeCategory = false;
        var categories = 'action|adventure|animation|biography|children|comedy|crime|disaster|documentary|drama|eastern|family|fan-film|fantasy|film-noir|food|game-show|history|holiday|home-and-garden|horror|indie|mini-series|music|musical|mystery|news|none|reality|road|romance|science-fiction|short|soap|special-interest|sports|sporting-event|suspense|talk-show|thriller|travel|tv-movie|war|western'.split('|'); // used by this.translateCategory()
        var translatedCategoryList = $filter('translate')('GENRELIST').split(',');

        FavoritesService.waitForInitialization().then(function() {
            if (FavoritesService.favorites.length == 0) {
                trending.noFavs = true;
            }
        });

        /*
         * enables excluding series already in favourites from trending results
         */
        var alreadyAddedSerieFilter = function(serie) {
            return this.favoriteIDs.indexOf(serie.tvdb_id.toString()) === -1;
        }.bind(FavoritesService);

        /*
         * Takes the English Category (as fetched from TraktTV) and returns a translation
         */
        this.translateCategory = function(category) {
            var idx = categories.indexOf(category);
            return (idx != -1) ? translatedCategoryList[idx] : category;
        };

        this.getCategories = function() {
            return TraktTVTrending.getCategories();
        };

        this.toggleCategory = function(category) {
            if (!category || this.activeCategory == category) {
                this.activeCategory = false;
                TraktTVTrending.getAll().then(function(result) {
                    trending.filtered = result.filter(alreadyAddedSerieFilter);
                });
                this.limit = this.oldLimit;
            } else {
                this.activeCategory = category;
                this.filtered = TraktTVTrending.getByCategory(category).filter(alreadyAddedSerieFilter);
                this.limit = this.filtered.length;
            }
        };

        this.getFilteredResults = function() {
            return this.filtered;
        };

        /**
         * load details side panel only after hovering for half a second
         * this prevents accidental loading if mouse is moving across posters
         */
        this.startHoverTimer = function(serie) {
            this.clearHoverTimer();
            this.hoverTimer = setTimeout(function() {
                $state.go('favorites.add.trakt-serie', {
                    id: serie.trakt_id
                });
            }.bind(this), 1000);
        };

        this.clearHoverTimer = function() {
            clearTimeout(this.hoverTimer);
        };

        this.setHoverSerie = function(serie) {
            $state.go('favorites.add.trakt-serie', {
                id: serie.trakt_id
            });
        };

        TraktTVTrending.getAll().then(function(results) {
            trending.filtered = results.filter(alreadyAddedSerieFilter);
        });
    }
]);