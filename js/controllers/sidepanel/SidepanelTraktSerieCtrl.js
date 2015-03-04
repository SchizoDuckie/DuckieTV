DuckieTV.controller('sidepanelTraktSerieCtrl', function($rootScope, $filter, $locale) {

    var sidepanel = this;
    this.serie = null;

    $rootScope.$on('traktserie:preview', function(event, serie) {
        sidepanel.serie = serie;
        $rootScope.$applyAsync();
    })

    /*
     * Takes a rating (8.12345) and converts it percentage presentation (81)
     */
    this.ratingPercentage = function(rating) {
        return Math.round(rating * 10);
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
});