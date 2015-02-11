angular.module('DuckieTV.directives.seriedetails', ['dialogs'])

/** 
 * The serie-details directive is what handles the overview for a tv-show.
 * It shows show details, actors, if it's still airing, the individual seasons and the delete show button.
 */
.directive('serieDetails', function(FavoritesService, $location, $dialogs, $filter, $locale, $rootScope) {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        templateUrl: function(elem, attr) {
            return attr.templateUrl || "templates/serieDetails.html";
        },
        link: function($scope) {

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
                'documentary',
                'drama',
                'family',
                'fantasy',
                'food',
                'game show',
                'history',
                'home and garden',
                'horror',
                'mini series',
                'mystery',
                'news',
                'no genre',
                'reality',
                'romance',
                'science-fiction',
                'soap',
                'special interest',
                'sport',
                'suspense',
                'talk show',
                'thriller',
                'travel',
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

            /**
             * Show the user a delete confirmation dialog before removing the show from favorites.
             * If confirmed: Remove from favorites and navigate back to the calendar.
             *
             * @param object serie Plain Old Javascript Object to delete
             */
            $scope.removeFromFavorites = function(serie) {
                var dlg = $dialogs.confirm($filter('translate')('SERIEDETAILSjs/serie-delete/hdr'),
                    $filter('translate')('SERIEDETAILSjs/serie-delete-question/p1') +
                    serie.name +
                    $filter('translate')('SERIEDETAILSjs/serie-delete-question/p2')
                );
                dlg.result.then(function(btn) {
                    console.log("Remove from favorites!", serie);
                    FavoritesService.remove(serie);
                    $location.path('/');
                }, function(btn) {
                    $scope.confirmed = $filter('translate')('SERIEDETAILSjs/serie-delete-confirmed');
                });
            };

            /**
             * Set the active season to one of the seaons passed to thedirective
             * @param object Season Plain Old Javascript Object season to fetch
             */
            $scope.setActiveSeason = function(season) {
                CRUD.FindOne('Season', {
                    ID_Season: season.ID_Season
                }).then(function(season) {
                    $scope.activeSeason = season;
                    $scope.$digest();
                });
            };

            /**
             * Format the airdate for a serie
             * @param object serie Plain Old Javascript Object
             * @return string formatted date
             */
            $scope.getAirDate = function(serie) {
                return new Date(serie.firstaired).toString();
            };

            /**
             * Hide or show a serie displaying on the calendar
             * @param object serie Plain Old Javascript Object
             */
            $scope.toggleSerieDisplay = function(serie) {
                CRUD.FindOne('Serie', {
                    ID_Serie: serie.ID_Serie
                }).then(function(serie2) {
                    if (serie2.get('displaycalendar') == 1) {
                        $scope.serie.displaycalendar = 0;
                        serie2.set('displaycalendar', 0);
                    } else {
                        $scope.serie.displaycalendar = 1;
                        serie2.set('displaycalendar', 1);
                    };
                    // Refresh calendar & page and save updates to db
                    $rootScope.$broadcast('calendar:clearcache');
                    $scope.$digest();
                    serie2.Persist();
                });
            };
        }
    };
});