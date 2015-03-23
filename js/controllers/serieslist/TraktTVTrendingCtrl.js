DuckieTV.controller('traktTvTrendingCtrl', ["$rootScope", "$filter", "TraktTVv2", "$state", "FavoritesService",
    function($rootScope, $filter, TraktTVv2, $state, FavoritesService) {
        var trending = this;
        this.results = [];
        this.filtered = [];
        this.limit = 100;
        this.categories = {};
        this.activeCategory = false;
        this.rawTranslatedCategoryList = $filter('translate')('SERIESLISTjs/category/list');
        this.categoryList = 'action|adventure|animation|children|comedy|crime|disaster|documentary|drama|eastern|family|fan-film|fantasy|film-noir|food|game-show|history|holiday|home-and-garden|horror|indie|mini-series|music|musical|mystery|news|none|reality|road|romance|science-fiction|short|soap|special-interest|sport|suspense|talk-show|thriller|travel|tv-movie|war|western'.split('|'); // used by this.translateCategory()
        this.translatedCategoryList = this.rawTranslatedCategoryList.split(',');
        this.currentFavs = FavoritesService.favorites.length;
        /*
         * Takes the English Category (as fetched from TraktTV) and returns a translation
         */
        this.translateCategory = function(category) {
            return (this.categoryList.indexOf(category) != -1) ? this.translatedCategoryList[this.categoryList.indexOf(category)] : category;
        };

        this.fetch = function() {
            //console.log('fetch trending!');
            if (trending.results.length == 0) {
                TraktTVv2.trending().then(function(res) {
                    trending.results = res || [];
                    trending.results.map(function(el) {
                        el.genres.map(function(genre) {
                            trending.categories[genre] = true;
                        })
                        trending.filtered.push(el);
                    })

                    $rootScope.$applyAsync();
                }).catch(function(error) {
                    $rootScope.$broadcast('trending:error', error);
                });
            }
        }

        this.toggleCategory = function(category) {
            if (this.activeCategory == category) {
                this.activeCategory = false;
            } else {
                this.activeCategory = category;
            }
            this.filtered = this.results.filter(function(show) {
                return !trending.activeCategory ? true : (show.genres.indexOf(category) > -1);
            })
            return this.filtered;
        }

        this.getFilteredResults = function() {
            return this.filtered;
        }


        /**
         * When in add mode, ng-hover sets this serie on the scope, so that it can be shown
         * by the seriedetails directive
         * @param {[type]} serie [description]
         */
        this.setHoverSerie = function(serie) {
            if ($state.current.name != "trakt-serie") {
                $state.go('trakt-serie');
            }
            $rootScope.$broadcast('traktserie:preview', serie);
            $rootScope.$applyAsync();
        };

        $rootScope.$on('trending:show', function() {
            trending.fetch();
        });
        this.fetch();
    }
])