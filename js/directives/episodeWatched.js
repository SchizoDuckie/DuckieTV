angular.module('DuckieTV.directives.episodewatched', [])
angular.module('DuckieTV.directives.episodewatched', [])

.directive('episodeWatched', function($rootScope, $filter, $document) {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            episode: '='
        },
        template: ['<a ng-click="markWatched()" class="glyphicon" tooltip="{{getToolTip()|translate}}{{getToolTipDate()}}" ng-class="{ \'glyphicon-eye-open\' : episode.get(\'watched\') ==  1, \'glyphicon-eye-close\' : episode.get(\'watched\') != 1 }" ng-transclude></a>'],
        link: function($scope) {

            $scope.tooltip = null;

            $scope.getToolTip = function() {
                return $scope.episode.get('watched') == 1 ? 'EPISODEWATCHED_JS-is-marked-lbl' : 'EPISODEWATCHED_JS-not-marked-lbl';
            }
            $scope.getToolTipDate = function() {
                return $scope.episode.get('watched') == 1 ? $filter('date')(new Date($scope.episode.get('watchedAt')), 'medium') : null;
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
