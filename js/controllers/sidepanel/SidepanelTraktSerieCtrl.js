DuckieTV.controller('sidepanelTraktSerieCtrl', function($rootScope, $filter) {

    var sidepanel = this;
    this.serie = null;

    $rootScope.$on('traktserie:preview', function(event, serie) {
        sidepanel.serie = serie;
        $rootScope.$applyAsync();
    })


    var daysOfWeekList = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ]; // used by translateDayOfWeek()

    var genreList = [
        'action',
        'adventure',
        'animation',
        'children',
        'comedy',
        'crime',
        'disaster',
        'documentary',
        'drama',
        'eastern',
        'family',
        'fan-film',
        'fantasy',
        'film-noir',
        'food',
        'game-show',
        'history',
        'holiday',
        'home-and-garden',
        'horror',
        'indie',
        'mini-series',
        'music',
        'musical',
        'mystery',
        'news',
        'none',
        'reality',
        'road',
        'romance',
        'science-fiction',
        'short',
        'soap',
        'special-interest',
        'sport',
        'suspense',
        'talk-show',
        'thriller',
        'travel',
        'tv-movie',
        'war',
        'western'
    ]; // used by translateGenre()
    var rawTranslatedGenreList = $filter('translate')('SERIECTRLjs/genre/list');
    var translatedGenreList = rawTranslatedGenreList.split(',');

    var statusList = [
        'canceled',
        'ended',
        'in production',
        'returning series'
    ]; // used by translateStatus()
    var rawTranslatedStatusList = $filter('translate')('SERIECTRLjs/status/list');
    var translatedStatusList = rawTranslatedStatusList.split(',');

    /*
     * Takes a rating (8.12345) and coverts it percentage presentation (81)
     */
    this.ratingPercentage = function(rating) {
        return Math.round(rating * 10);
    };

    /*
     * Takes the English day of the week (as fetched from TraktTV) and returns a translation
     */
    this.translateDayOfWeek = function(dayofweek) {
        return $locale.DATETIME_FORMATS.DAY[daysOfWeekList.indexOf(dayofweek)];
    };

    /*
     * Takes the English genre (as fetched from TraktTV) and returns a translation
     */
    this.translateGenre = function(genre) {
        return (genreList.indexOf(genre) != -1) ? translatedGenreList[genreList.indexOf(genre)] : genre;
    };

    /*
     * Takes the English status (as fetched from TraktTV) and returns a translation
     */
    this.translateStatus = function(status) {
        return (statusList.indexOf(status) != -1) ? translatedStatusList[statusList.indexOf(status)] : status;
    };
});