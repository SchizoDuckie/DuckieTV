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
        controllerAs: 'trending',
        bindToController: true,
        require: '^seriesList'
    }
})

.controller('traktTvTrendingCtrl', function($scope, TraktTVv2) {
    var trending = this;
    this.results = [];
    this.limit = 100;

    TraktTVv2.trending().then(function(res) {
        trending.results = res
    }).catch(function(error) {
        $scope.$emit('trending:error', error);
    });

})


.directive('traktTvSearch', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/serieslist/searching.html',
        controller: 'traktTvSearchCtrl',
        controllerAs: 'traktSearch',
        bindToController: true,
        require: '^seriesList',
    }
})

.controller('traktTvSearchCtrl', function($scope, $rootScope, TraktTVv2) {

    var traktSearch = this;

    this.results = [];
    this.searching = false;
    this.error = false;

    /**
     * Fires when user types in the search box. Executes trakt.tv search based on find-while-you type.
     */
    this.findSeries = function(query) {
        if (query.trim().length < 2) { // when query length is smaller than 2 chars, auto-show the trending results
            $scope.$broadcast('trending:show');
            this.results = [];
            this.error = false;
            this.searching = false;
            TraktTVv2.cancelSearch();
            // emit $scope.enableAdd();
            return;
        }
        // $scope.search.searching = true;
        this.error = false;

        return TraktTVv2.search(query).then(function(res) {
            traktSearch.error = false;
            traktSearch.searching = TraktTVv2.hasActiveSearchRequest();
            traktSearch.results = res || [];
            $rootScope.$broadcast('trending:hide');
            $scope.$applyAsync();
        }).catch(function(err) {
            console.error("Search error!", err);
            traktSearch.error = err;
            traktSearch.searching = TraktTVv2.hasActiveSearchRequest();
            traktSearch.results = [];
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
        bindToController: true,
        require: '^seriesList',
    }
})

.controller('localSeriesCtrl', function(FavoritesService, TraktTVv2, SettingsService, $dialogs, $filter, $scope) {

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


    this.refresh = function(serie) {
        $scope.$emit('serie:updating', serie);
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
        controller: 'seriesListCtrl'
    }
})

.controller('seriesListCtrl', function(FavoritesService, $rootScope, $scope, TraktTVv2) {

    var serieslist = $scope.serieslist = this;

    this.activated = false; // Toggles when the favorites panel activated

    this.searchingForSerie = false; // Toggles when 'add a show' is clicked
    this.serieAddFocus = false; // Toggles this to automatically bring focus to the 'start typing to search for a serie' textbox
    this.showTrakt = false;
    this.serie = null; // active hover serie to pass to the sidepanel


    this.adding = { // holds any TVDB_ID's that are adding

    };

    this.error = {

    };

    var titleSorter = function(serie) {
        serie.sortName = serie.name ? serie.name.replace('The ', '') : '';
        return serie;
    };


    this.favorites = FavoritesService.favorites.map(titleSorter);

    /**
     * Toggle or untoggle the favorites panel
     */
    this.activate = function(el) {
        this.activated = true;
        document.body.style.overflowY = 'hidden';

        if (this.favorites.length > 0) {
            this.disableAdd(); // disable add mode when the panel is activated every time. But not if favorites list is empty.
        } else {
            this.enableAdd();
        }
    };

    /**
     * Close the drawer
     */
    this.closeDrawer = function() {
        this.activated = false;
        document.body.style.overflowY = 'auto';
    };

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
    });

    /**
     * When we detect the serieslist is empty, we pop up the panel and enable add mode.
     * This also enables trakt.tv most trending series download when it hasn't happen
     */
    $rootScope.$on('serieslist:empty', function(event) {
        console.log("Serieslist empty!!! ");
        serieslist.activate();
        serieslist.enableAdd();
    });

    $scope.$on('serie:updating', function(event, serie) {
        serieslist.adding[serie.tvdb_id] = true;
        TraktTVv2.resolveTVDBID(serie.TVDB_ID).then(serieslist.selectSerie);
    });

    $rootScope.$on('trending:hide', function(event) {
        serieslist.showTrakt = false;
    });

    /**
     * When in add mode, ng-hover sets this serie on the scope, so that it can be shown
     * by the seriedetails directive
     * @param {[type]} serie [description]
     */
    this.setHoverSerie = function(serie) {
        this.serie = serie;
    };

    /**
     * Add a show to favorites.*The serie object is a Trakt.TV TV Show Object.
     * Queues up the tvdb_id in the $scope.adding array so that the spinner can be shown.
     * Then adds it to the favorites list and when that 's done, toggles the adding flag to false so that
     * It can show the checkmark.
     */
    this.selectSerie = function(serie) {
        if (!(serie.tvdb_id in serieslist.adding)) { // serieslist is coming from the parent directive. aliassed there.
            serieslist.adding[serie.tvdb_id] = true;
            if ((serie.tvdb_id in serieslist.error)) {
                delete serieslist.error[serie.tvdb_id];
            }
            return TraktTVv2.serie(serie.slug_id).then(function(serie) {
                return FavoritesService.addFavorite(serie).then(function() {
                    $rootScope.$broadcast('storage:update');
                    serieslist.adding[serie.tvdb_id] = false;
                });
            }, function(error) {
                console.error("Error adding show!", error);
                serieslist.adding[serie.tvdb_id] = false;
                serieslist.error[serie.tvdb_id] = error;
            });
        }
    };

    /**
     * Enabled 'add' serie mode.
     * Toggles the search panel and populates the trending mode when needed.
     */
    this.enableAdd = function() {
        this.searchingForSerie = true;
        this.showTrakt = true;

    };

    /**
     * Turn 'add serie' mode off, reset to stored display mode.
     */
    this.disableAdd = function() {
        this.searchingForSerie = false;
        this.showTrakt = false;
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