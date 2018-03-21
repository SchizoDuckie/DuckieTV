DuckieTV.controller('SidepanelSerieCtrl', ["$rootScope", "$filter", "$location", "$locale", "$q", "$state", "$injector", "dialogs", "FavoritesService", "latestSeason", "notWatchedSeason", "serie", "SidePanelState", "SettingsService", "FavoritesManager",
    function($rootScope, $filter, $location, $locale, $q, $state, $injector, dialogs, FavoritesService, latestSeason, notWatchedSeason, serie, SidePanelState, SettingsService, FavoritesManager) {

        var self = this;
        this.serie = serie;
        this.latestSeason = latestSeason;
        this.notWatchedSeason = notWatchedSeason;
        this.notWatchedEpsBtn = SettingsService.get('series.not-watched-eps-btn');
        this.watchedDownloadedPaired = SettingsService.get('episode.watched-downloaded.pairing');
        this.isRefreshing = false;
        this.markAllWatchedAlert = false;
        /**
         * Closes the SidePanel expansion
         */
        this.closeSidePanel = function() {
            SidePanelState.hide();
        };
        /**
         * Closes the SidePanel expansion
         */
        this.closeSidePanelExpansion = function() {
            $injector.get('SidePanelState').contract();
            $state.go('serie');
        }

        this.refresh = function(serie) {
            this.isRefreshing = true;
            return FavoritesManager.refresh(serie.TVDB_ID).then(function() {
                self.isRefreshing = false;
                $rootScope.$applyAsync();
            });
        };

        var timePlurals = $filter('translate')('TIMEPLURALS').split('|'); //" day, | days, | hour and | hours and | minute | minutes "
        this.totalRunTime = null;
        this.totalRunLbl = null;
        CRUD.executeQuery('select count(ID_Episode) as amount from Episodes where seasonnumber > 0 AND firstaired > 0 AND firstaired < ? AND ID_Serie = ? group by episodes.ID_Serie', [new Date().getTime(), this.serie.ID_Serie]).then(function(result) {
            if (result.rows.length > 0) {
                self.totalRunTime = result.rows[0].amount * self.serie.runtime;
                var totalRunDays = Math.floor(self.totalRunTime / 60 / 24);
                var totalRunHours = Math.floor((self.totalRunTime % (60 * 24)) / 60);
                var totalRunMinutes = self.totalRunTime % 60;
                var dayLbl = (totalRunDays === 1) ? timePlurals[0] : timePlurals[1];
                var hourLbl = (totalRunHours === 1) ? timePlurals[2] : timePlurals[3];
                var minuteLbl = (totalRunMinutes === 1) ? timePlurals[4] : timePlurals[5];
                self.totalRunLbl = ((totalRunDays > 0) ? (totalRunDays.toString() + dayLbl) : "") + totalRunHours.toString() + hourLbl + totalRunMinutes.toString() + minuteLbl;
            } else {
                self.totalRunTime = 1;
                self.totalRunLbl = '0' + timePlurals[1] + '0' + timePlurals[3] + '0' + timePlurals[5];
            }
            return true;
        }).then(function() {
            CRUD.executeQuery('select count(ID_Episode) as amount from Episodes where seasonnumber > 0 AND firstaired > 0 AND firstaired < ? AND ID_Serie = ? AND watched = 1 group by episodes.ID_Serie', [new Date().getTime(), self.serie.ID_Serie]).then(function(result) {
                if (result.rows.length > 0) {
                    self.totalWatchedTime = result.rows[0].amount * self.serie.runtime;
                    var totalRunDays = Math.floor(self.totalWatchedTime / 60 / 24);
                    var totalRunHours = Math.floor((self.totalWatchedTime % (60 * 24)) / 60);
                    var totalRunMinutes = self.totalWatchedTime % 60;
                    var dayLbl = (totalRunDays === 1) ? timePlurals[0] : timePlurals[1];
                    var hourLbl = (totalRunHours === 1) ? timePlurals[2] : timePlurals[3];
                    var minuteLbl = (totalRunMinutes === 1) ? timePlurals[4] : timePlurals[5];
                    self.totalWatchedLbl = ((totalRunDays > 0) ? totalRunDays.toString() + dayLbl : "") + ((totalRunHours > 0) ? totalRunHours.toString() + hourLbl : "") + totalRunMinutes.toString() + minuteLbl;
                    self.totalWatchedPercent = $filter('number')(self.totalWatchedTime / self.totalRunTime * 100, 2);
                } else {
                    self.totalWatchedTime = 1;
                    self.totalWatchedLbl = '0' + timePlurals[1] + '0' + timePlurals[3] + '0' + timePlurals[5];
                    self.totalWatchedPercent = 0;
                }
                $rootScope.$applyAsync();
            });
        });


        this.nextEpisode = null;
        this.prevEpisode = null;

        serie.getLastEpisode().then(function(result) {
            self.prevEpisode = result;
            $rootScope.$applyAsync();
        });

        serie.getNextEpisode().then(function(result) {
            self.nextEpisode = result;
            $rootScope.$applyAsync();
        });


        this.markAllWatched = function(serie) {
            serie.markSerieAsWatched(this.watchedDownloadedPaired,$rootScope).then(function() {
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

        this.removeFromFavorites = function() {
            FavoritesManager.remove(this.serie).then(function() {
                SidePanelState.hide();
            });
        }


        var genreList = 'action|adventure|animation|anime|biography|children|comedy|crime|disaster|documentary|drama|eastern|family|fan-film|fantasy|film-noir|food|game-show|history|holiday|home-and-garden|horror|indie|mini-series|music|musical|mystery|news|none|reality|road|romance|science-fiction|short|soap|special-interest|sports|sporting-event|superhero|suspense|talk-show|thriller|travel|tv-movie|war|western'.split('|'), // used by this.translateGenre()
            translatedGenreList = $filter('translate')('GENRELIST').split('|'),
            translatedStatusList = $filter('translate')('STATUSLIST').split('|'),
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

        this.dataToClipboard = function(data) {
            var clip = nw.Clipboard.get();
            clip.set(data.replace(/\|/g,'\r\n'), 'text');
        };
    }
]);