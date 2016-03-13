DuckieTV.controller('seriesListCtrl', ["FavoritesService", "$rootScope", "$scope", "SettingsService", "TraktTVv2", "SidePanelState", "SeriesListState", "$state", "$http", "$filter", "dialogs", "$q",
    function(FavoritesService, $rootScope, $scope, SettingsService, TraktTVv2, SidePanelState, SeriesListState, $state, $http, $filter, dialogs, $q) {

        var serieslist = this;

        /**
         * Context Menu that appears when right clicking on series
         * * Mark all watched/unwatched
         * * --
         * * Hide/Show series on calendar
         * * Remove from Favorites
         **/

        this.contextMenu = function(serie) {
            return [[ // Mark all watched
                    $filter('translate')('COMMON/mark-all-watched/lbl'),
                    function() {
                        serie.markSerieAsWatched($rootScope).then(function() {
                            $rootScope.$broadcast('serie:recount:watched', serie.ID_Serie);
                        });
                    }, function() {
                        return serie.notWatchedCount == 0 ?
                            false : true;
                    }
                ], 
                null, //Divider
                [ // Toggle Calendar Display Option
                    serie.displaycalendar == '1' ? 
                        $filter('translate')('SIDEPANEL/SERIE-OVERVIEW/calendar-hide/btn') : 
                        $filter('translate')('SIDEPANEL/SERIE-OVERVIEW/calendar-show/btn'), 
                    function() {
                        serie.toggleCalendarDisplay();
                    }
                ], [ //Remove Serie option
                    $filter('translate')('SIDEPANEL/SERIE-OVERVIEW/delete-serie/btn'), function() {
                        removeFromFavorites(serie);
                    }
                ],
               
            ];
        };

        /**
         * Pop up a confirm dialog and remove the serie from favorites when confirmed.
         */
        var removeFromFavorites = function(serie) {
            var dlg = dialogs.confirm($filter('translate')('SIDEPANELSERIECTRLjs/serie-delete/hdr'),
                $filter('translate')('SIDEPANELSERIECTRLjs/serie-delete-question/desc') +
                serie.name +
                $filter('translate')('SIDEPANELSERIECTRLjs/serie-delete-question/desc2')
            );
            dlg.result.then(function(btn) {
                console.info("Removing serie '" + serie.name + "' from favorites!", serie);
                FavoritesService.remove(serie);
            }, function(btn) {
                this.confirmed = $filter('translate')('SIDEPANELSERIECTRLjs/serie-delete-cancelled/lbl');
            });
        };

        this.activated = SeriesListState.state.isShowing; // Toggles when the favorites panel activated
        this.mode = SettingsService.get('series.displaymode'); // series display mode. Either 'banner' or 'poster', banner being wide mode, poster for portrait.
        this.isSmall = SettingsService.get('library.smallposters'); // library posters size , true for small, false for large
        this.sgEnabled = SettingsService.get('library.seriesgrid');
        this.hideEnded = false;

        this.setOrderBy = function(orderBy) {
            var idx = serieslist.orderByList.indexOf(orderBy);
            serieslist.reverse = !serieslist.orderReverseList[idx];
            serieslist.orderReverseList = serieslist.orderReverseResetList.slice();
            serieslist.orderReverseList[idx] = serieslist.reverse;
            serieslist.orderBy = orderBy;
        };

        this.orderByList = 'getSortName()|added|firstaired|notWatchedCount'.split('|');
        this.orderReverseResetList = [true,false,true,false];
        this.orderReverseList = [true,false,true,false];
        this.orderBy = 'getSortName()';
        this.reverse = false;
        this.translatedOrderByList = $filter('translate')('ORDERBYLIST').split(',');        

        /*
         * Takes the English orderBy (elements from Series table) and returns a translation
         */
        this.translateOrderBy = function(orderBy) {
            var idx = serieslist.orderByList.indexOf(orderBy);
            return (idx != -1) ? serieslist.translatedOrderByList[idx] : serieslist.translatedOrderByList[0];
        };
        
        FavoritesService.flushAdding();
        this.query = ''; // local filter query, set from LocalSerieCtrl
        this.genreFilter = []; // genre filter from localseriectrl 
        this.statusFilter = [];
        this.isFiltering = false;

        $rootScope.$on('serieslist:filter', function(evt, query) {
            serieslist.query = query;
        });

        $rootScope.$on('serieslist:genreFilter', function(evt, genres) {
            serieslist.genreFilter = genres;
        });

        $rootScope.$on('serieslist:statusFilter', function(evt, status) {
            serieslist.statusFilter = status;
        });

        Object.observe(SeriesListState.state, function(newValue) {
            serieslist.activated = newValue[0].object.isShowing;
            $scope.$applyAsync();
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

        /**
         * Closes the trakt-serie-details sidepanel when exiting adding mode
         */
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
                    var id = ('imdb_id' in serie && serie.imdb_id != null) ? serie.imdb_id : serie.slug_id;
                    return TraktTVv2.serie(id).then(function(serie) {
                        return FavoritesService.addFavorite(serie).then(function() {
                            $rootScope.$broadcast('storage:update');
                            FavoritesService.added(serie.tvdb_id);
                        });
                    }, function(err) {
                        console.error("Error adding show!", err);
                        FavoritesService.added(serie.tvdb_id);
                        FavoritesService.addError(serie.tvdb_id, err);
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