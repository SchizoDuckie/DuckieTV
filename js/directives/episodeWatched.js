angular.module('DuckieTV.directives.episodewatched', [])

.directive('episodeWatched', function($rootScope, $filter, $document) {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            episode: '='
        },
        template: ['<a ng-click="markWatched()" class="glyphicon" tooltip="{{getToolTip()}}" ng-class="{ \'glyphicon-eye-open\' : episode.get(\'watched\') ==  1, \'glyphicon-eye-close\' : episode.get(\'watched\') != 1 }" ng-transclude></a>'],
        link: function($scope) {

            $scope.tooltip = null;

            $scope.getToolTip = function() {
                return $scope.episode.get('watched') == 1 ?
                    $filter('translate')('EPISODEWATCHEDjs/is-marked/lbl') +
                        $filter('date')(new Date($scope.episode.get('watchedAt')), 'medium') :
                    $filter('translate')('EPISODEWATCHEDjs/not-marked/lbl');
            }
            $scope.markWatched = function() {

                if ($scope.episode.get('watched') == '1') {
                    $scope.episode.set('watchedAt', null);
                    $scope.episode.set('watched', '0');
                } else {
                    $scope.episode.set('watchedAt', new Date().getTime());
                	$scope.episode.set('watched', '1');
                }

                $scope.episode.Persist();
            }
        }
    }
})
