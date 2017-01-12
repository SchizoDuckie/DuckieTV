DuckieTV.controller('SidepanelSerieCtrl', [ "$rootScope", "$scope", "$filter", "$location", "$locale", "$q", "$state", "dialogs", "FavoritesService",  "latestSeason", "notWatchedSeason", "serie", "SidePanelState", "SeriesListState", "SettingsService", "TraktTVv2",
    function($rootScope, $scope, $filter, $location, $locale, $q, $state, dialogs, FavoritesService,  latestSeason, notWatchedSeason, serie, SidePanelState,SeriesListState, SettingsService, TraktTVv2) {

        var self = this;

        this.serie = serie;
        this.latestSeason = latestSeason;
        this.notWatchedSeason = notWatchedSeason;
        this.notWatchedEpsBtn =  SettingsService.get('series.not-watched-eps-btn');
        this.isRefreshing = false;
        this.markAllWatchedAlert = false;

    /**
     * Closes the SidePanel 
     */
    this.closeSidePanel = function() {
        if (SeriesListState.state.isShowing) {
            SidePanelState.hide();
            $state.go('favorites');
        } else {
            $state.go('calendar');
        }
    }

    /**
     * Closes the SidePanel expansion
     */
    this.closeSidePanelExpansion = function() {
        SidePanelState.contract();
        $state.go('serie');
    }

        this.refresh = function(serie) {
            this.isRefreshing = true;
            //console.debug("Refreshing!");
            TraktTVv2.resolveTVDBID(serie.TVDB_ID).then(self.selectSerie).then(function(result) {
                setTimeout(function() {
                    self.isRefreshing = false;
                    //console.debug("Done!");
                    $scope.$applyAsync();
                }, 500);
            });
        };

        var timePlurals = $filter('translate')('TIMEPLURALS').split('|'); //" day, | days, | hour and | hours and | minute | minutes "
        this.totalRunTime = null;
        this.totalRunLbl = null;
        CRUD.executeQuery('select count(ID_Episode) as amount from Episodes where seasonnumber > 0 AND firstaired > 0 AND firstaired < ? AND ID_Serie = ? group by episodes.ID_Serie', [new Date().getTime(), this.serie.ID_Serie]).then(function(result) {
            if (result.rs.rows.length > 0) {
                self.totalRunTime = result.rs.rows.item(0).amount * self.serie.runtime;
                var totalRunDays = Math.floor(self.totalRunTime / 60 / 24);
                var totalRunHours = Math.floor((self.totalRunTime % (60 * 24)) / 60);
                var totalRunMinutes = self.totalRunTime % 60;
                var dayLbl = (totalRunDays === 1) ? timePlurals[0] : timePlurals[1];
                var hourLbl = (totalRunHours === 1) ? timePlurals[2] : timePlurals[3];
                var minuteLbl = (totalRunMinutes === 1) ? timePlurals[4] : timePlurals[5];
                self.totalRunLbl = totalRunDays.toString() + dayLbl + totalRunHours.toString() + hourLbl + totalRunMinutes.toString() + minuteLbl;
            } else {
                self.totalRunTime = 1;
                self.totalRunLbl = '0' +  timePlurals[1] + '0' +  timePlurals[3] + '0' +  timePlurals[5];
            }
        });

        this.nextEpisode = null;
        this.prevEpisode = null;

        serie.getLastEpisode().then(function(result) {
            self.prevEpisode = result;
            $scope.$applyAsync();
        });

        serie.getNextEpisode().then(function(result) {
            self.nextEpisode = result;
            $scope.$applyAsync();
        });


        this.markAllWatched = function(serie) {
            serie.markSerieAsWatched($rootScope).then(function() {
                $rootScope.$broadcast('serie:recount:watched', serie.ID_Serie);
                self.markAllWatchedAlert = false; // reset alert flag
            });
        };

        this.markAllWatchedCancel = function() {
            self.markAllWatchedAlert = false; // reset alert flag
        };

        this.markAllWatchedQuery = function() {
            self.markAllWatchedAlert = true; // set alert flag
        };

        /**
         * Add a show to favorites.*The serie object is a Trakt.TV TV Show Object.
         * Queues up the tvdb_id in the serieslist.adding array so that the spinner can be shown.
         * Then adds it to the favorites list and when that 's done, toggles the adding flag to false so that
         * It can show the checkmark.
         */
        this.selectSerie = function(serie) {
            if (!FavoritesService.isAdding(serie.tvdb_id)) {
                FavoritesService.adding(serie.tvdb_id);
                return TraktTVv2.serie(serie.slug_id).then(function(serie) {
                    return FavoritesService.addFavorite(serie, undefined, undefined, true).then(function() {
                        $rootScope.$broadcast('storage:update');
                        FavoritesService.added(serie.tvdb_id);
                    });
                }, function(err) {
                    console.error("Error adding show!", err);
                    FavoritesService.added(serie.tvdb_id);
                    FavoritesService.addError(serie.tvdb_id, err);
                });
            }
        };

        this.torrentSettings = function() {
            var d = dialogs.create('templates/settings/serieSettings.html', 'serieSettingsCtrl', {
                serie: self.serie
            }, {
                bindToController: true,
                size: 'xs'
            });

            d.result.then(function() {
                //console.debug('Success');
                d = undefined;
            }, function() {
                //console.debug('Cancelled');
                d = undefined;

            });
        };

        /**
         * Pop up a confirm dialog and remove the serie from favorites when confirmed.
         */
        this.removeFromFavorites = function() {
            var dlg = dialogs.confirm($filter('translate')('COMMON/serie-delete/hdr'),
                $filter('translate')('COMMON/serie-delete-question/desc') +
                this.serie.name +
                $filter('translate')('COMMON/serie-delete-question/desc2')
            );
            dlg.result.then(function(btn) {
                console.info("Removing serie '" + serie.name + "' from favorites!");
                FavoritesService.remove(serie);
                SidePanelState.hide();
            }, function(btn) {
                this.confirmed = $filter('translate')('COMMON/cancelled/lbl');
            });
        };

        var genreList = 'action|adventure|animation|biography|children|comedy|crime|disaster|documentary|drama|eastern|family|fan-film|fantasy|film-noir|food|game-show|history|holiday|home-and-garden|horror|indie|mini-series|music|musical|mystery|news|none|reality|road|romance|science-fiction|short|soap|special-interest|sports|sporting-event|suspense|talk-show|thriller|travel|tv-movie|war|western'.split('|'), // used by this.translateGenre()
            translatedGenreList = $filter('translate')('GENRELIST').split(','),
            translatedStatusList = $filter('translate')('STATUSLIST').split(','),
            statusList = 'canceled|ended|in production|returning series|planned'.split('|'), // used by this.translateStatus()
            daysOfWeekList = 'Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday'.split('|'); // used by this.translateDayOfWeek()

        /**
         * Takes the English Genre (as fetched from TraktTV) and returns a translation
         */
        this.translateGenre = function(genre) {
            var idx = genreList.indexOf(genre);
            return (idx != -1) ? translatedGenreList[idx] : genre;
        };

        /**
         * Takes the English day of the week (as fetched from TraktTV) and returns a translation
         */
        this.translateDayOfWeek = function(dayofweek) {
            return $locale.DATETIME_FORMATS.DAY[daysOfWeekList.indexOf(dayofweek)];
        };

        /**
         * Takes the English status (as fetched from TraktTV) and returns a translation
         */
        this.translateStatus = function(status) {
            var idx = statusList.indexOf(status);
            return (idx != -1) ? translatedStatusList[idx] : status;
        };

        /**
         * Returns true as long as the add a show to favorites promise is running.
         */
        this.isAdding = function(tvdb_id) {
            return FavoritesService.isAdding(tvdb_id);
        };
    }
]);
