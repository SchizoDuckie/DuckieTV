DuckieTV.controller('seriesListCtrl', ["FavoritesService", "$rootScope", "$scope", "SettingsService", "TraktTVv2", "SidePanelState", "SeriesListState", "$state", "$http", "$filter", "dialogs",
    function(FavoritesService, $rootScope, $scope, SettingsService, TraktTVv2, SidePanelState, SeriesListState, $state, $http, $filter, dialogs) {

        var vm = this;

        /**
         * Context Menu that appears when right clicking on series
         * * Mark all watched/unwatched
         * * --
         * * Hide/Show series on calendar
         * * Remove from Favorites
         **/

        vm.contextMenu = function(serie) {
            return [
                [ // Mark all watched
                    $filter('translate')('COMMON/mark-all-watched/lbl'),
                    function() {
                        serie.markSerieAsWatched($rootScope).then(function() {
                            $rootScope.$broadcast('serie:recount:watched', serie.ID_Serie);
                        });
                    },
                    function() {
                        return serie.notWatchedCount == 0 ?
                            false : true;
                    }
                ],
                null, //Divider
                [ // Toggle Calendar Display Option
                    serie.displaycalendar == 1 ?
                    $filter('translate')('COMMON/calendar-hide/btn') :
                    $filter('translate')('COMMON/calendar-show/btn'),
                    function() {
                        serie.toggleCalendarDisplay();
                    }
                ],
                [ //Remove Serie option
                    $filter('translate')('COMMON/delete-serie/btn'),
                    function() {
                        removeFromFavorites(serie);
                    }
                ]

            ];
        };

        /**
         * Pop up a confirm dialog and remove the serie from favorites when confirmed.
         */
        var removeFromFavorites = function(serie) {
            var dlg = dialogs.confirm($filter('translate')('COMMON/serie-delete/hdr'),
                $filter('translate')('COMMON/serie-delete-question/desc') +
                serie.name +
                $filter('translate')('COMMON/serie-delete-question/desc2')
            );
            dlg.result.then(function() {
                console.info("Removing serie '" + serie.name + "' from favorites!");
                FavoritesService.remove(serie);
            }, function() {
                vm.confirmed = $filter('translate')('COMMON/cancelled/lbl');
            });
        };

        vm.activated = SeriesListState.state.isShowing; // Toggles when the favorites panel activated
        vm.mode = SettingsService.get('series.displaymode'); // series display mode. Either 'banner' or 'poster', banner being wide mode, poster for portrait.
        vm.isSmall = SettingsService.get('library.smallposters'); // library posters size , true for small, false for large
        vm.sgEnabled = SettingsService.get('library.seriesgrid');
        vm.hideEnded = false;

        vm.setOrderBy = function(orderBy, evt) {
            evt.stopPropagation()
            var idx = vm.orderByList.indexOf(orderBy);
            vm.reverse = !vm.orderReverseList[idx];
            vm.orderReverseList = vm.orderReverseResetList.slice();
            vm.orderReverseList[idx] = vm.reverse;
            vm.orderBy = orderBy;
            $rootScope.$emit('lazyImg:refresh');
        };

        vm.orderByList = 'getSortName()|added|firstaired|notWatchedCount'.split('|');
        vm.orderReverseResetList = [false, false, true, false];
        vm.orderReverseList = [false, false, true, false];
        vm.orderBy = 'getSortName()';
        vm.reverse = false;
        vm.translatedOrderByList = $filter('translate')('ORDERBYLIST').split(',');

        /*
         * Takes the English orderBy (elements from Series table) and returns a translation
         */
        vm.translateOrderBy = function(orderBy) {
            var idx = vm.orderByList.indexOf(orderBy);
            return (idx != -1) ? vm.translatedOrderByList[idx] : vm.translatedOrderByList[0];
        };

        FavoritesService.flushAdding();
        vm.query = ''; // local filter query, set from LocalSerieCtrl
        vm.genreFilter = []; // genre filter from localseriectrl
        vm.statusFilter = [];
        vm.isFiltering = false;

        vm.toggleFiltering = function() {
            vm.isFiltering = !vm.isFiltering;
            vm.query = '';
            $rootScope.$emit('lazyImg:refresh');
        }

        $rootScope.$on('serieslist:filter', function(evt, query) {
            vm.query = query;
        });

        $rootScope.$on('serieslist:genreFilter', function(evt, genres) {
            vm.genreFilter = genres;
        });

        $rootScope.$on('serieslist:statusFilter', function(evt, status) {
            vm.statusFilter = status;
        });

        Object.observe(SeriesListState.state, function(newValue) {
            vm.activated = newValue[0].object.isShowing;
            $scope.$applyAsync();
        });

        vm.localFilter = function(el) {
            var nameMatch = true,
                statusMatch = true,
                genreMatch = true;
            if (vm.query.length > 0) {
                nameMatch = el.name.toLowerCase().indexOf(vm.query.toLowerCase()) > -1;
            }
            if (vm.statusFilter.length > 0) {
                statusMatch = vm.statusFilter.indexOf(el.status) > -1;
            }
            if (vm.genreFilter.length > 0) {
                var matched = false;
                vm.genreFilter.map(function(genre) {
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
        vm.execFilter = function() {
            setTimeout(function() {
                document.querySelector('.series serieheader a').click();
            }, 0);
        };

        vm.getFavorites = function() {
            return FavoritesService.favorites;
        };

        /**
         * Set the series list display mode to either banner or poster.
         * Temporary mode is for enabling for instance the search, it's not stored.
         */
        vm.setMode = function(mode, temporary) {
            if (!temporary) {
                SettingsService.set('series.displaymode', mode);
            }
            vm.mode = mode;
            $rootScope.$emit('lazyImg:refresh');
        };

        /**
         * Closes the trakt-serie-details sidepanel when exiting adding mode
         */
        vm.closeSidePanel = function() {
            SidePanelState.hide();
        };

        /**
         * Toggles small mode on off
         */
        vm.toggleSmall = function() {
            vm.isSmall = !vm.isSmall;
            SettingsService.set('library.smallposters', vm.isSmall);
            // If the posters become smaller we may need to load extra images so fire a recheck
            $rootScope.$emit('lazyImg:refresh');
        };

        /**
         * Toggle or untoggle the favorites panel
         */
        vm.activate = function() {
            vm.activated = true;
        };

        /**
         * Close the drawer
         */
        vm.closeDrawer = function() {
            vm.activated = false;
            document.body.style.overflowY = 'auto';
        };

        /**
         * Fires when user hits enter in the search serie box.Auto - selects the first result and adds it to favorites.
         */

        vm.selectFirstResult = function() {
            vm.selectSerie(vm.results[0]);
        };

        /**
         * Add a show to favorites.*The serie object is a Trakt.TV TV Show Object.
         * Queues up the tvdb_id in the serieslist.adding array so that the spinner can be shown.
         * Then adds it to the favorites list and when that 's done, toggles the adding flag to false so that
         * It can show the checkmark.
         */
        vm.selectSerie = function(serie) {
            if (!FavoritesService.isAdding(serie.tvdb_id)) {
                if (!FavoritesService.isAdded(serie.tvdb_id)) {
                    FavoritesService.adding(serie.tvdb_id);
                    var id = ('trakt_id' in serie && serie.trakt_id != null) ? serie.trakt_id : ('imdb_id' in serie && serie.imdb_id != null) ? serie.imdb_id : serie.slug_id;
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
        vm.isAdded = function(tvdb_id) {
            return FavoritesService.isAdded(tvdb_id);
        };

        /**
         * Returns true as long as the add a show to favorites promise is running.
         */
        vm.isAdding = function(tvdb_id) {
            return FavoritesService.isAdding(tvdb_id);
        };

        /**
         * Returns true as long as the add a show to favorites promise is running.
         */
        vm.isError = function(tvdb_id) {
            return FavoritesService.isError(tvdb_id);
        };
    }
]);
