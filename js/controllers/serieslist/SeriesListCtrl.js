DuckieTV.controller('seriesListCtrl', ["FavoritesService", "$rootScope", "$scope", "SettingsService", "TraktTVv2", "SidePanelState", "SeriesListState", "$state",
    function(FavoritesService, $rootScope, $scope, SettingsService, TraktTVv2, SidePanelState, SeriesListState, $state) {

        var serieslist = this;

        this.width = SidePanelState.state.isExpanded ? document.body.clientWidth - 800 : SidePanelState.state.isShowing ? document.body.clientWidth - 400 : document.body.clientWidth;
        this.activated = SeriesListState.state.isShowing; // Toggles when the favorites panel activated
        this.mode = SettingsService.get('series.displaymode'); // series display mode. Either 'banner' or 'poster', banner being wide mode, poster for portrait.
        this.isSmall = SettingsService.get('library.smallposters'); // library posters size , true for small, false for large
        this.hideEnded = false;

        this.adding = {} // holds any TVDB_ID's that are adding (todo: move to favoritesservice)
        this.error = {};
        this.query = ''; // local filter query, set from LocalSerieCtrl


        /**
         * Automatically launch the first search result when user hits enter in the filter form
         */
        this.execFilter = function() {
            setTimeout(function() {
                console.log('execing quer!');
                document.querySelector('.series serieheader a').click();
            }, 0)
        };

        $rootScope.$on('serieslist:filter', function(evt, query) {
            serieslist.query = query;
        })

        this.localFilter = function(el) {
            return el.name.toLowerCase().indexOf(serieslist.query.toLowerCase()) > -1;
        };


        Object.observe(SeriesListState.state, function(newValue) {
            serieslist.activated = newValue[0].object.isShowing;
            if (!serieslist.activated) {
                SidePanelState.hide();
            }

            sidepanelMonitor([{
                object: SidePanelState.state
            }]);
            $scope.$applyAsync();
        });


        var timeout = null;

        function setWidthMinus(minus) {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(function() {
                var serieslist = document.querySelector('series-list > div');
                if (serieslist) {
                    serieslist.style.width = 'calc(100% - ' + minus + 'px)';
                }
            }, 0);
        };

        function sidepanelMonitor(newValue) {
            if (!SeriesListState.state.isShowing) return;
            if (newValue[0].object.isExpanded) {
                setWidthMinus(800);
            } else if (newValue[0].object.isShowing) {
                setWidthMinus(400);
            } else {
                setWidthMinus(0)
            }
        }

        Object.observe(SidePanelState.state, sidepanelMonitor);
        sidepanelMonitor([{
            object: SidePanelState.state
        }]);


        this.getFavorites = function() {
            setTimeout(function() {
                if (FavoritesService.favorites.length == 0 && $state.current != 'favorites.add.empty') {
                    $state.go('favorites.add.empty');
                }
            }, 50);

            return FavoritesService.favorites;
        }

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
            SettingsService.set('library.smallposters', this.isSmall);
        };

        /**
         * Toggle or untoggle the favorites panel
         */
        this.activate = function(el) {
            this.activated = true;
        }

        /**
         * Close the drawer
         */
        this.closeDrawer = function() {
            this.activated = false;
            document.body.style.overflowY = 'auto';
        };


        /**
         * When we detect the serieslist is empty, we pop up the panel and enable add mode.
         * This also enables trakt.tv most trending series download when it hasn't happen
         */
        $rootScope.$on('serieslist:empty', function(event) {
            console.log("Serieslist empty!!! ");
            serieslist.activate();
        });

        $scope.$on('serie:updating', function(event, serie) {
            // note: this serie is a CRUD.entity
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
         * Queues up the tvdb_id in the serieslist.adding array so that the spinner can be shown.
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