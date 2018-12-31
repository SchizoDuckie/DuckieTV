/**
 * The serie-details directive is what handles the overview for a tv-show.
 * It shows show details, actors, if it's still airing, the individual seasons and the delete show button.
 */
DuckieTV.directive('serieDetails', ['FavoritesService', '$location', 'dialogs', '$filter', '$locale', 'SeriesMetaTranslations',
  function(FavoritesService, $location, dialogs, $filter, SeriesMetaTranslations) {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      controllerAs: 'details',
      templateUrl: function(elem, attr) {
        return attr.templateUrl || 'templates/sidepanel/serie-details.html'
      },
      link: function($scope) {
        $scope.translateGenre = SeriesMetaTranslations.translateGenre
        $scope.translateStatus = SeriesMetaTranslations.translateStatus
        $scope.translateDayOfWeek = SeriesMetaTranslations.translateDayOfWeek

        /*
        * Takes a rating (8.12345) and coverts it percentage presentation (81)
        */
        $scope.ratingPercentage = function(rating) {
          return Math.round(rating * 10)
        }

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
          )
          dlg.result.then(function(btn) {
            console.info("Removing serie '" + serie.name + "' from favorites!")
            FavoritesService.remove(serie)
            $location.path('/')
          }, function(btn) {
            $scope.confirmed = $filter('translate')('COMMON/cancelled/lbl')
          })
        }

        /**
         * Set the active season to one of the seaons passed to thedirective
         * @param object Season Plain Old Javascript Object season to fetch
         */
        $scope.setActiveSeason = function(season) {
          CRUD.FindOne('Season', {
            ID_Season: season.ID_Season
          }).then(function(season) {
            $scope.activeSeason = season
            $scope.$digest()
          })
        }

        /**
         * Format the airdate for a serie
         * @param object serie Plain Old Javascript Object
         * @return string formatted date
         */
        $scope.getAirDate = function(serie) {
          return new Date(serie.firstaired).toString()
        }

        /**
         * Hide or show a serie displaying on the calendar
         * @param object serie Plain Old Javascript Object
         */
        $scope.toggleSerieDisplay = function(serie) {
          CRUD.FindOne('Serie', {
            ID_Serie: serie.ID_Serie
          }).then(function(serie2) {
            if (serie2.get('displaycalendar') == 1) {
              $scope.serie.displaycalendar = 0
              serie2.set('displaycalendar', 0)
            } else {
              $scope.serie.displaycalendar = 1
              serie2.set('displaycalendar', 1)
            }
            // save updates to db
            $scope.$digest()
            serie2.Persist()
          })
        }
      }
    }
  }
])
