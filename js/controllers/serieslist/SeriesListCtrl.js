DuckieTV.controller('seriesListCtrl', ["FavoritesService", "$rootScope", "$scope", "SettingsService", "TraktTVv2", "SidePanelState", "$state",
    function(FavoritesService, $rootScope, $scope, SettingsService, TraktTVv2, SidePanelState, $state) {

        var serieslist = $scope.serieslist = this;

        this.width = SidePanelState.state.isExpanded ? document.body.clientWidth - 800 : SidePanelState.state.isShowing ? document.body.clientWidth - 400 : document.body.clientWidth;
        this.activated = true; // Toggles when the favorites panel activated

        this.mode = SettingsService.get('series.displaymode'); // series display mode. Either 'banner' or 'poster', banner being wide mode, poster for portrait.
        this.isSmall = false; // Toggles the poster zoom
        this.hideEnded = false;
        document.body.style.overflowY = 'hidden';


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
         * Toggle or untoggle the favorites panel
         */
        this.activate = function(el) {
            this.activated = true;
            document.body.style.overflowY = 'hidden';
            if (FavoritesService.favorites.length == 0) {
                $state.go('favorites.add.empty');
            } else {
                $state.go('favorites');
            }
        }

        /**
         * Close the drawer
         */
        this.closeDrawer = function() {
            this.activated = false;
            document.body.style.overflowY = 'auto';
        };

        /**
         * Another class could fire an event that says this thing should open or close.
         * This is hooked from app.js, which monitors location changes.
         */
        $rootScope.$on('serieslist:toggle', function() {
            if (!serieslist.activated) {
                return serieslist.activate();
            }
            serieslist.closeDrawer();
        });

        /**
         * Another class could fire an event that says this thing should open or close.
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
            if (!data) return;
            serieslist.favorites = data.map(titleSorter);
            serieslist.background = data[Math.floor(Math.random() * (data.length - 1))].fanart;

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


        /**
         * Fires when user hits enter in the search serie box.Auto - selects the first result and adds it to favorites.
         */

        this.selectFirstResult = function() {
            this.selectSerie(this.results[0]);

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

    }
]);