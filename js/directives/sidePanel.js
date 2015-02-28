angular.module('DuckieTV.directives.sidepanel', ['DuckieTV.providers.favorites', 'DuckieTV.providers.episodeaired'])
    .factory('SidePanelState', function() {

        var service = {
            state: {
                isShowing: false,
                isExpanded: false
            },
            show: function() {
                document.body.style.overflowY = 'hidden';
                document.body.scrollTop = 0;
                service.state.isShowing = true;
                service.state.isExpanded = false;
            },
            hide: function() {
                document.body.style.overflowY = 'auto';
                service.contract();
                service.state.isShowing = false;
            },
            expand: function() {
                service.state.isExpanded = true;
            },
            contract: function() {
                service.state.isExpanded = false;
            }
        };
        return service;
    })

.directive('sidepanel', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/sidepanel/sidepanel.html',
        controllerAs: 'panel',
        bindToController: true,
        transclude: true,

        controller: function($rootScope, $scope, SidePanelState) {
            var panel = this;

            this.isShowing = false;
            this.isExpanded = false;

            Object.observe(SidePanelState.state, function(newValue) {
                panel.isShowing = newValue[0].object.isShowing;
                panel.isExpanded = newValue[0].object.isExpanded;
                $scope.$applyAsync();
            })
            if (SidePanelState.state.isShowing) {
                this.isShowing = true;
            }
            if (SidePanelState.state.isExpanded) {
                this.isExpanded = true;
            }

            this.toggle = function() {
                this.isShowing ? SidePanelState.hide() : SidePanelState.show();
            };
            this.hide = function() {
                SidePanelState.hide();
            };
        }
    }
})

.controller('sidepanelTraktSerieCtrl', function($rootScope, $filter) {

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
    $scope.ratingPercentage = function(rating) {
        return Math.round(rating * 10);
    };

    /*
     * Takes the English day of the week (as fetched from TraktTV) and returns a translation
     */
    $scope.translateDayOfWeek = function(dayofweek) {
        return $locale.DATETIME_FORMATS.DAY[daysOfWeekList.indexOf(dayofweek)];
    };

    /*
     * Takes the English genre (as fetched from TraktTV) and returns a translation
     */
    $scope.translateGenre = function(genre) {
        return (genreList.indexOf(genre) != -1) ? translatedGenreList[genreList.indexOf(genre)] : genre;
    };

    /*
     * Takes the English status (as fetched from TraktTV) and returns a translation
     */
    $scope.translateStatus = function(status) {
        return (statusList.indexOf(status) != -1) ? translatedStatusList[statusList.indexOf(status)] : status;
    };
});