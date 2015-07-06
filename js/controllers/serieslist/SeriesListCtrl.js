DuckieTV.controller('seriesListCtrl', ["FavoritesService", "$rootScope", "$scope", "SettingsService", "TraktTVv2", "SidePanelState", "SeriesListState", "$state", "$http",
    function(FavoritesService, $rootScope, $scope, SettingsService, TraktTVv2, SidePanelState, SeriesListState, $state, $http) {

        var serieslist = this;

        this.width = SidePanelState.state.isExpanded ? document.body.clientWidth - 800 : SidePanelState.state.isShowing ? document.body.clientWidth - 400 : document.body.clientWidth;
        this.activated = SeriesListState.state.isShowing; // Toggles when the favorites panel activated
        this.mode = SettingsService.get('series.displaymode'); // series display mode. Either 'banner' or 'poster', banner being wide mode, poster for portrait.
        this.isSmall = SettingsService.get('library.smallposters'); // library posters size , true for small, false for large
        this.hideEnded = false;

        FavoritesService.flushAdding();
        this.query = ''; // local filter query, set from LocalSerieCtrl
        this.genreFilter = []; // genre filter from localseriectrl 
        this.statusFilter = [];
        this.isFiltering = false;
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
        }

        function sidepanelMonitor(newValue) {
            if (!SeriesListState.state.isShowing) return;
            if (newValue[0].object.isExpanded) {
                setWidthMinus(800);
            } else if (newValue[0].object.isShowing) {
                setWidthMinus(400);
            } else {
                setWidthMinus(0);
            }
        }

        Object.observe(SidePanelState.state, sidepanelMonitor);
        sidepanelMonitor([{
            object: SidePanelState.state
        }]);

        $rootScope.$on('serieslist:filter', function(evt, query) {
            serieslist.query = query;
        });

        $rootScope.$on('serieslist:genreFilter', function(evt, genres) {
            serieslist.genreFilter = genres;
        });

        $rootScope.$on('serieslist:statusFilter', function(evt, status) {
            serieslist.statusFilter = status;
        });


        this.localFilter = function(el) {
            var nameMatch = true,
                statusMatch = true,
                genreMatch = true;
            if (serieslist.query.length > 0) {
                nameMatch = el.name.toLowerCase().indexOf(serieslist.query.toLowerCase()) > -1;
            }
            if (serieslist.statusFilter.length > 0) {
                statusMatch = serieslist.statusFilter.indexOf(el.status) > -1;
            }
            if (serieslist.genreFilter.length > 0) {
                var matched = false;
                serieslist.genreFilter.map(function(genre) {
                    if (el.genre.indexOf(genre) > -1) {
                        matched = true;
                    }
                });
                genreMatch = matched;
            }
            return nameMatch && statusMatch && genreMatch;
        };

        /**
         * Automatically launch the first search result when user hits enter in the filter form
         */
        this.execFilter = function() {
            setTimeout(function() {
                document.querySelector('.series serieheader a').click();
            }, 0);
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

        this.getFavorites = function() {
            return FavoritesService.favorites;
        };

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

        this.closeSidePanel = function() {
            SidePanelState.hide();
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
        };

        /**
         * Close the drawer
         */
        this.closeDrawer = function() {
            this.activated = false;
            document.body.style.overflowY = 'auto';
        };

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
            if (!FavoritesService.isAdding(serie.tvdb_id)) {
                if (!FavoritesService.isAdded(serie.tvdb_id)) {
                    FavoritesService.adding(serie.tvdb_id);
                    return TraktTVv2.serie(serie.slug_id).then(function(serie) {
                        return FavoritesService.addFavorite(serie).then(function() {
                            $rootScope.$broadcast('storage:update');
                            FavoritesService.added(serie.tvdb_id);
                        });
                    }, function(err) {
                        console.error("Error adding show!", err);
                        FavoritesService.added(serie.tvdb_id);
                        FavoritesService.addError(serie.tvdb_id, err);
                    });
                } else {
                    $state.go('serie', {
                        id: FavoritesService.getById(serie.tvdb_id).ID_Serie
                    });
                }
            }
        };

        /**
         * Verify with the favoritesservice if a specific TVDB_ID is registered.
         * Used to show checkmarks in the add modes for series that you already have.
         */
        this.isAdded = function(tvdb_id) {
            return FavoritesService.isAdded(tvdb_id);
        };

        /**
         * Returns true as long as the add a show to favorites promise is running.
         */
        this.isAdding = function(tvdb_id) {
            return FavoritesService.isAdding(tvdb_id);
        };

        /**
         * Returns true as long as the add a show to favorites promise is running.
         */
        this.isError = function(tvdb_id) {
            return FavoritesService.isError(tvdb_id);
        };
    }
]);