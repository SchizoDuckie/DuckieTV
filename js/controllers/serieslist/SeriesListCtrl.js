DuckieTV.controller('seriesListCtrl', ["FavoritesService", "$rootScope", "SettingsService", "SidePanelState", "SeriesListState", "$state", "$filter", "FavoritesManager",
    function(FavoritesService, $rootScope, SettingsService, SidePanelState, SeriesListState, $state, $filter, FavoritesManager) {

        var vm = this;
        vm.activated = true;
        vm.mode = SettingsService.get('series.displaymode'); // series display mode. Either 'banner' or 'poster', banner being wide mode, poster for portrait.
        vm.isSmall = SettingsService.get('library.smallposters'); // library posters size , true for small, false for large
        vm.sgEnabled = SettingsService.get('library.seriesgrid');
        vm.hideEnded = false;
        vm.watchedDownloadedPaired = SettingsService.get('episode.watched-downloaded.pairing');


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
                        serie.markSerieAsWatched(vm.watchedDownloadedPaired, $rootScope).then(function() {
                            $rootScope.$broadcast('serie:recount:watched', serie.ID_Serie);
                        });
                    },
                    function() {
                        return serie.notWatchedCount == 0 ? false : true;
                    }
                ],
                [ // Mark all downloaded
                    $filter('translate')('COMMON/mark-all-downloaded/lbl'),
                    function() {
                        serie.markSerieAsDownloaded($rootScope);
                    }
                ],
                null, // Divider
                [ // Toggle Calendar Display Option
                    serie.displaycalendar == 1 ?
                    $filter('translate')('COMMON/calendar-hide/btn') :
                    $filter('translate')('COMMON/calendar-show/btn'),
                    function() {
                        serie.toggleCalendarDisplay();
                    }
                ],
                [ // Remove Serie option, pops up confirmation.
                    $filter('translate')('COMMON/delete-serie/btn'),
                    function() {
                        FavoritesManager.remove(serie);
                    }
                ]

            ];
        };

        vm.setOrderBy = function(orderBy, evt) {
            evt.stopPropagation();
            var idx = vm.orderByList.indexOf(orderBy);
            vm.reverse = vm.orderReverseList[idx];
            vm.orderReverseList = vm.orderReverseResetList.slice();
            vm.orderReverseList[idx] = !vm.reverse;
            vm.orderBy = orderBy;
            SettingsService.set('library.order.by', vm.orderBy);
            SettingsService.set('library.order.reverseList', vm.orderReverseList);
        };

        vm.orderByList = 'getSortName()|added|firstaired|notWatchedCount'.split('|');
        vm.orderReverseResetList = [true, false, true, true];
        vm.orderReverseList = SettingsService.get('library.order.reverseList'); // default [true, false, true, true]
        vm.orderBy = SettingsService.get('library.order.by'); // default 'getSortName()'
        vm.reverse = !vm.orderReverseList[vm.orderByList.indexOf(vm.orderBy)]; // default false;
        vm.translatedOrderByList = $filter('translate')('ORDERBYLIST').split('|');

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
        vm.isFiltering = true;

        vm.toggleFiltering = function() {
            vm.isFiltering = !vm.isFiltering;
            vm.query = '';
        };

        $rootScope.$on('serieslist:filter', function(evt, query) {
            vm.query = query;
        });

        $rootScope.$on('serieslist:genreFilter', function(evt, genres) {
            vm.genreFilter = genres;
        });

        $rootScope.$on('serieslist:statusFilter', function(evt, status) {
            vm.statusFilter = status;
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
         * Fires when user hits enter in the search serie box.Auto - selects the first result and opens details subpanel.
         */

        vm.selectFirstResult = function() {
            document.querySelectorAll("serieheader")[0].click();
        };

        /**
         * Add a show to favorites.
         * The serie object is a Trakt.TV TV Show Object.
         * Queues up the tvdb_id in the serieslist.adding array so that the spinner can be shown.
         * Then adds it to the favorites list and when that 's done, toggles the adding flag to false so that
         * It can show the checkmark.
         */
        vm.selectSerie = function(serie) {
            FavoritesManager.add(serie).then(function() {
                $state.go('serie', {
                    id: FavoritesService.getById(serie.tvdb_id).ID_Serie
                });
            });
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