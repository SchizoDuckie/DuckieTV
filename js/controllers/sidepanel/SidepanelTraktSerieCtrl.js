DuckieTV.controller('sidepanelTraktSerieCtrl', function($rootScope, $filter, $locale, serie) {

    var sidepanel = this;
    this.serie = serie;


    /*
     * Takes a rating (8.12345) and converts it percentage presentation (81)
     */
    this.ratingPercentage = function(rating) {
        return Math.round(rating * 10);
    };

    var genreList = 'action|adventure|animation|children|comedy|crime|disaster|documentary|drama|eastern|family|fan-film|fantasy|film-noir|food|game-show|history|holiday|home-and-garden|horror|indie|mini-series|music|musical|mystery|news|none|reality|road|romance|science-fiction|short|soap|special-interest|sport|suspense|talk-show|thriller|travel|tv-movie|war|western'.split('|'); // used by this.translateGenre()
    var translatedGenreList = $filter('translate')('GENRELIST').split(',');
    var translatedStatusList = $filter('translate')('STATUSLIST').split(',');
    var statusList = 'canceled|ended|in production|returning series'.split('|'); // used by this.translateStatus()
    var daysOfWeekList = 'Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday'.split('|'); // used by this.translateDayOfWeek()

    /*
     * Takes the English Genre (as fetched from TraktTV) and returns a translation
     */
    this.translateGenre = function(genre) {
        var idx = genreList.indexOf(genre);
        return (idx != -1) ? translatedGenreList[idx] : genre;
    };

    /*
     * Takes the English day of the week (as fetched from TraktTV) and returns a translation
     */
    this.translateDayOfWeek = function(dayofweek) {
        return $locale.DATETIME_FORMATS.DAY[daysOfWeekList.indexOf(dayofweek)];
    };

    /*
     * Takes the English status (as fetched from TraktTV) and returns a translation
     */
    this.translateStatus = function(status) {
        var idx = statusList.indexOf(status);
        return (idx != -1) ? translatedStatusList[idx] : status;
    };
});