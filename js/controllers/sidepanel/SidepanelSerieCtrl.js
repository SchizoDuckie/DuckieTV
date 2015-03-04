DuckieTV.controller('SidepanelSerieCtrl', function($dialogs, $filter, $locale, FavoritesService, $location, serie, latestSeason, SidePanelState) {

    this.serie = serie;
    this.latestSeason = latestSeason;

    this.toggleSerieDisplay = function() {
        this.serie.displaycalendar = sidepanel.serie.displaycalendar == '1' ? '0' : '1';
        this.serie.Persist().then(function() {
            $rootScope.$broadcast('favorites:updated');
        });
    };

    /**
     * Pop up a confirm dialog and remove the serie from favorites when confirmed.
     */
    this.removeFromFavorites = function() {
        var dlg = $dialogs.confirm($filter('translate')('SERIESLISTjs/serie-delete/hdr'),
            $filter('translate')('SERIESLISTjs/serie-delete-question/p1') +
            this.serie.name +
            $filter('translate')('SERIESLISTjs/serie-delete-question/p2')
        );
        dlg.result.then(function(btn) {
            console.log("Removing serie '" + serie.name + "' from favorites!", serie);
            FavoritesService.remove(serie);
            SidePanelState.hide();
        }, function(btn) {
            this.confirmed = $filter('translate')('SERIESLISTjs/serie-delete-confirmed');
        });
    };

    this.rawTranslatedGenreList = $filter('translate')('SERIECTRLjs/genre/list');
    this.translatedGenreList = this.rawTranslatedGenreList.split(',');
    this.genreList = 'action|adventure|animation|children|comedy|crime|disaster|documentary|drama|eastern|family|fan-film|fantasy|film-noir|food|game-show|history|holiday|home-and-garden|horror|indie|mini-series|music|musical|mystery|news|none|reality|road|romance|science-fiction|short|soap|special-interest|sport|suspense|talk-show|thriller|travel|tv-movie|war|western'.split('|'); // used by this.translateGenre()
    /*
     * Takes the English Genre (as fetched from TraktTV) and returns a translation
     */
    this.translateGenre = function(genre) {
        return (this.genreList.indexOf(genre) != -1) ? this.translatedGenreList[this.genreList.indexOf(genre)] : genre;
    };

    this.daysOfWeekList = 'Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday'.split('|'); // used by this.translateDayOfWeek()
    /*
     * Takes the English day of the week (as fetched from TraktTV) and returns a translation
     */
    this.translateDayOfWeek = function(dayofweek) {
        return $locale.DATETIME_FORMATS.DAY[this.daysOfWeekList.indexOf(dayofweek)];
    };

    this.rawTranslatedStatusList = $filter('translate')('SERIECTRLjs/status/list');
    this.translatedStatusList = this.rawTranslatedStatusList.split(',');
    this.statusList = 'canceled|ended|in production|returning series'.split('|'); // used by this.translateStatus()
    /*
     * Takes the English status (as fetched from TraktTV) and returns a translation
     */
    this.translateStatus = function(status) {
        return (this.statusList.indexOf(status) != -1) ? this.translatedStatusList[this.statusList.indexOf(status)] : status;
    };
})