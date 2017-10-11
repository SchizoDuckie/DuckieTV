/** 
 * The serie-details directive is what handles the overview for a tv-show.
 * It shows show details, actors, if it's still airing, the individual seasons and the delete show button.
 */
DuckieTV.directive('serieDetails', ["FavoritesService", "$location", "dialogs", "$filter", "$locale", "$rootScope",
    function(FavoritesService, $location, dialogs, $filter, $locale, $rootScope) {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            controllerAs: 'details',
            templateUrl: function(elem, attr) {
                return attr.templateUrl || "templates/sidepanel/serie-details.html";
            },
            link: function($scope) {

                var genreList = 'action|adventure|animation|anime|biography|children|comedy|crime|disaster|documentary|drama|eastern|family|fan-film|fantasy|film-noir|food|game-show|history|holiday|home-and-garden|horror|indie|mini-series|music|musical|mystery|news|none|reality|road|romance|science-fiction|short|soap|special-interest|sports|sporting-event|superhero|suspense|talk-show|thriller|travel|tv-movie|war|western'.split('|'), // used by $scope.translateGenre()
                    translatedGenreList = $filter('translate')('GENRELIST').split('|'),
                    translatedStatusList = $filter('translate')('STATUSLIST').split('|'),
                    statusList = 'canceled|ended|in production|returning series|planned'.split('|'), // used by $scope.translateStatus()
                    daysOfWeekList = 'Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday'.split('|'); // used by $scope.translateDayOfWeek()

                /*
                 * Takes the English Genre (as fetched from TraktTV) and returns a translation
                 */
                $scope.translateGenre = function(genre) {
                    var idx = genreList.indexOf(genre);
                    return (idx != -1) ? translatedGenreList[idx] : genre;
                };

                /*
                 * Takes the English day of the week (as fetched from TraktTV) and returns a translation
                 */
                $scope.translateDayOfWeek = function(dayofweek) {
                    return $locale.DATETIME_FORMATS.DAY[daysOfWeekList.indexOf(dayofweek)];
                };

                /*
                 * Takes the English status (as fetched from TraktTV) and returns a translation
                 */
                $scope.translateStatus = function(status) {
                    var idx = statusList.indexOf(status);
                    return (idx != -1) ? translatedStatusList[idx] : status;
                };

                /*
                 * Takes a rating (8.12345) and coverts it percentage presentation (81)
                 */
                $scope.ratingPercentage = function(rating) {
                    return Math.round(rating * 10);
                };

                /**
                 * Show the user a delete confirmation dialog before removing the show from favorites.
                 * If confirmed: Remove from favorites and navigate back to the calendar.
                 *
                 * @param object serie Plain Old Javascript Object to delete
                 */
                $scope.removeFromFavorites = function(serie) {
                    var dlg = dialogs.confirm($filter('translate')('COMMON/serie-delete/hdr'),
                        $filter('translate')('COMMON/serie-delete-question/desc') +
                        serie.name +
                        $filter('translate')('COMMON/serie-delete-question/desc2')
                    );
                    dlg.result.then(function(btn) {
                        console.info("Removing serie '" + serie.name + "' from favorites!");
                        FavoritesService.remove(serie);
                        $location.path('/');
                    }, function(btn) {
                        $scope.confirmed = $filter('translate')('COMMON/cancelled/lbl');
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
                        // save updates to db
                        $scope.$digest();
                        serie2.Persist();
                    });
                };
            }
        };
    }
]);