DuckieTV.controller('SidepanelSerieCtrl', function($dialogs, $rootScope, $filter, $locale, FavoritesService, $location, serie, latestSeason, SidePanelState, TraktTVv2) {

    var sidepanel = this;

    this.serie = serie;
    this.latestSeason = latestSeason;

    this.refresh = function(serie) {
        $rootScope.$broadcast('serie:updating', serie);
    };

    $rootScope.$on('serie:updating', function(event, serie) {
        // note: this serie is a CRUD.entity
        TraktTVv2.resolveTVDBID(serie.TVDB_ID).then(sidepanel.selectSerie);
    });

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
                return FavoritesService.addFavorite(serie).then(function() {
                    $rootScope.$broadcast('storage:update');
                    FavoritesService.added(serie.tvdb_id);
                });
            }, function(err) {
                console.error("Error adding show!", err);
                FavoritesService.added(serie.tvdb_id);
                FavoritesService.addError(serie.tvdb_id,err);
            });
        }
    };

    this.toggleSerieDisplay = function() {
        this.serie.displaycalendar = this.serie.displaycalendar == '1' ? '0' : '1';
        this.serie.Persist();
    };

    /**
     * Pop up a confirm dialog and remove the serie from favorites when confirmed.
     */
    this.removeFromFavorites = function() {
        var dlg = $dialogs.confirm($filter('translate')('SIDEPANELSERIECTRLjs/serie-delete/hdr'),
            $filter('translate')('SIDEPANELSERIECTRLjs/serie-delete-question/desc') +
            this.serie.name +
            $filter('translate')('SIDEPANELSERIECTRLjs/serie-delete-question/desc2')
        );
        dlg.result.then(function(btn) {
            console.log("Removing serie '" + serie.name + "' from favorites!", serie);
            FavoritesService.remove(serie);
            SidePanelState.hide();
        }, function(btn) {
            this.confirmed = $filter('translate')('SIDEPANELSERIECTRLjs/serie-delete-cancelled/lbl');
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
    /**
     * Returns true as long as the add a show to favorites promise is running.
     */
    this.isAdding = function(tvdb_id) {
        return FavoritesService.isAdding(tvdb_id);
    };
})