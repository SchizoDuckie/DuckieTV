angular.module('DuckieTV.directives.serieslist', ['dialogs'])

/**
 * The Serieslist directive is what's holds the favorites list and allows you to add/remove series and episodes to your calendar.
 * It also is used as the main navigation to get to any of your series.
 */
.directive('traktTvTrending', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/serieslist/trending.html',
        controller: 'traktTvTrendingCtrl',
        controllerAs: 'trend',
        require: '^seriesList'
    }
})

.controller('traktTvTrendingCtrl', function($scope, TraktTVv2) {
    var trend = this;
    this.trending = {
        results: []
    };

    TraktTVv2.trending().then(function(res) {
        trend.trending.results = res
    }).catch(function(error) {
        $scope.$emit('trending:error', error);
    });

})


.directive('traktTvSearch', function(TraktTVv2) {
    return {
        restrict: 'E',
        templateUrl: 'templates/serieslist/searching.html',
        controller: 'traktTvSearchCtrl',
        controllerAs: 'search',
        require: '^seriesList',
    }
})

.controller('traktTvSearchCtrl', function() {

    var search = this;

    this.query = undefined;
    this.results = null;
    this.searching = false;


    this.serie = null; // active hover serie

    /**
     * When in add mode, ng-hover sets this serie on the scope, so that it can be shown
     * by the seriedetails directive
     * @param {[type]} serie [description]
     */
    $this.setHoverSerie = function(serie) {
        this.serie = serie;
    };

    /**
     * Fires when user types in the search box. Executes trakt.tv search based on find-while-you type.
     */
    this.findSeries = function() {
        if (this.query.trim().length < 2) { // when query length is smaller than 2 chars, auto-show the trending results
            this.trendingSeries = true;
            this.results = null;
            this.error = false;
            this.searching = false;
            TraktTVv2.cancelSearch();
            // emit $scope.enableAdd();
            return;
        }
        // $scope.search.searching = true;
        this.search.error = false;
        this.trendingSeries = false;
        // disableBatchMode makes sure that previous request are aborted when a new one is started.
        return TraktTVv2.search($scope.search.query).then(function(res) {
            this.error = false;
            this.searching = TraktTVv2.hasActiveSearchRequest();
            this.trendingSeries = false; // we have a result, hide the trending series.
            this.results = res || [];
        }).catch(function(err) {
            console.error("Search error!", err);
            this.error = err;
            this.searching = TraktTVv2.hasActiveSearchRequest();
            this.trendingSeries = false; // we have a result, hide the trending series.
            this.results = false;
        });
    };

    /**
     * Fires when user hits enter in the search serie box.Auto - selects the first result and adds it to favorites.
     */

    this.selectFirstResult = function() {
        this.selectSerie(this.results[0]);

    };



})

.directive('localSeries', function(FavoritesService) {
    return {
        restrict: 'E',
        templateUrl: 'templates/serieslist/favorites.html',
        controller: 'localSeriesCtrl',
        controllerAs: 'local',
        require: '^seriesList',
    }
})

.controller('localSeriesCtrl', function(FavoritesService, TraktTvV2, SettingsService, $dialogs, $filter, $location) {

    this.mode = SettingsService.get('series.displaymode'); // series display mode. Either 'banner' or 'poster', banner being wide mode, poster for portrait.
    this.isSmall = false; // Toggles the poster zoom
    this.hideEnded = false;

    /**
     * Set the series list display mode to either banner or poster.
     * Temporary mode is for enabling for instance the search, it's not stored.
     */
    this.setMode = function(mode, temporary) {
        if (!temporary) {
            SettingsService.set('series.displaymode', mode);
        }
        this.mode = mode;
    };

    /**
     * Toggles small mode on off
     */
    this.toggleSmall = function() {
        this.isSmall = !this.isSmall;
    };

    /**
     * Change location to the series details when clicked from display mode.
     */
    this.go = function(serieID, episode) {
        window.location.href = '#/serie/' + serieID + '/episode/' + episode.TVDB_ID;
    };


    $scope.refresh = function(serie) {
        serieslist.adding[serie.tvdb_id] = true;
        TraktTVv2.resolveTVDBID(serie.TVDB_ID).then($scope.selectSerie);
    };


    /**
     * Pop up a confirm dialog and remove the serie from favorites when confirmed.
     */
    this.removeFromFavorites = function(serie) {
        var dlg = $dialogs.confirm($filter('translate')('SERIEDETAILSjs/serie-delete/hdr'),
            $filter('translate')('SERIEDETAILSjs/serie-delete-question/p1') +
            serie.name +
            $filter('translate')('SERIEDETAILSjs/serie-delete-question/p2')
        );
        dlg.result.then(function(btn) {
            console.log("Removing serie '" + serie.name + "' from favorites!", serie);
            FavoritesService.remove(serie);
            if (typeof $location != "undefined") {
                $location.path('/');
            }
        }, function(btn) {
            this.confirmed = $filter('translate')('SERIEDETAILSjs/serie-delete-confirmed');
        });
    };

})

.directive('seriesList', function() {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: "templates/seriesList.html",
        controllerAs: 'serieslist',
        bindToController: true,
        controller: 'seriesListCtrl',
        link: function($scope, iElement) {

            /**
             * Toggle or untoggle the favorites panel
             */
            $scope.activate = function(el) {
                iElement.addClass('active');
                serieslist.activated = true;

                if (serieslist.favorites.length > 0) {
                    serieslist.disableAdd(); // disable add mode when the panel is activated every time. But not if favorites list is empty.
                } else {
                    serieslist.enableAdd();
                }
            };

            /**
             * Close the drawer
             */
            $scope.closeDrawer = function() {
                iElement.removeClass('active');
                $scope.activated = false;
            };

        }
    }
})

.controller('seriesListCtrl', function(FavoritesService, $rootScope, $scope) {

    var serieslist = this;

    this.activated = false; // Toggles when the favorites panel activated

    this.searchingForSerie = false; // Toggles when 'add a show' is clicked
    this.serieAddFocus = false; // Toggles this to automatically bring focus to the 'start typing to search for a serie' textbox

    this.addings = { // holds any TVDB_ID's that are adding

    };

    this.error = {

    };

    var titleSorter = function(serie) {
        serie.sortName = serie.name ? serie.name.replace('The ', '') : '';
        return serie;
    };


    this.favorites = FavoritesService.favorites.map(titleSorter);



    /**
     * Another class could fire an event that says this thing should close.
     * This is hooked from app.js, which monitors location changes.
     */
    $rootScope.$on('serieslist:hide', function() {
        serieslist.closeDrawer();
    });

    /**
     * When the favorites list signals it's updated, we update the favorites here as well.
     * when the series list is empty, this makes it automatically pop up.
     * Otherwise, a random background is automagically loaded.
     */
    $rootScope.$on('favorites:updated', function(event, data) {
        serieslist.favorites = data.map(titleSorter);
        if (serieslist.favorites.length === 0) {
            serieslist.activate();
            serieslist.enableAdd();
        }
        $scope.$digest();
    });

    /**
     * When we detect the serieslist is empty, we pop up the panel and enable add mode.
     * This also enables trakt.tv most trending series download when it hasn't happen
     */
    $rootScope.$on('serieslist:empty', function(event) {
        console.log("Serieslist empty!!! ");
        serieslist.activate();
    });

    /**
     * Add a show to favorites.*The serie object is a Trakt.TV TV Show Object.
     * Queues up the tvdb_id in the $scope.adding array so that the spinner can be shown.
     * Then adds it to the favorites list and when that 's done, toggles the adding flag to false so that
     * It can show the checkmark.
     */
    this.selectSerie = function(serie) {
        if (!(serie.tvdb_id in this.adding)) { // serieslist is coming from the parent directive. aliassed there.
            this.adding[serie.tvdb_id] = true;
            if ((serie.tvdb_id in this.error)) {
                delete this.error[serie.tvdb_id];
            }
            return TraktTVv2.serie(serie.slug_id).then(function(serie) {
                return FavoritesService.addFavorite(serie).then(function() {
                    $rootScope.$broadcast('storage:update');
                    this.adding[serie.tvdb_id] = false;
                });
            }, function(error) {
                console.error("Error adding show!", error);
                this.adding[serie.tvdb_id] = false;
                this.error[serie.tvdb_id] = error;
            });
        }
    };

    /**
     * Enabled 'add' serie mode.
     * Toggles the search panel and populates the trending mode when needed.
     */
    this.enableAdd = function() {
        this.searchingForSerie = true;

    };

    /**
     * Turn 'add serie' mode off, reset to stored display mode.
     */
    this.disableAdd = function() {
        this.searchingForSerie = false;
    };



    // used by the searching-sidepanel.html
    this.ratingPercentage = function(rating) {
        return Math.round(rating * 10);
    };

    /**
     * Verify with the favoritesservice if a specific TVDB_ID is registered.
     * Used to show checkmarks in the add modes for series that you already have.
     */
    this.isAdded = function(tvdb_id) {
        if (tvdb_id === null) return false;
        return FavoritesService.hasFavorite(tvdb_id.toString());
    };

    /**
     * Returns true as long as the add a show to favorites promise is running.
     */
    this.isAdding = function(tvdb_id) {
        if (tvdb_id === null) return false;
        return ((tvdb_id in this.adding) && (this.adding[tvdb_id] === true));
    };

    /**
     * Returns true as long as the add a show to favorites promise is running.
     */
    this.isError = function(tvdb_id) {
        if (tvdb_id === null) return false;
        return ((tvdb_id in this.error));
    };

});