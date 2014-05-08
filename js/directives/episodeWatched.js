angular.module('DuckieTV.directives.episodewatched', [])

.directive('episodeWatched', function($rootScope, $document) {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            episode: '='
        },
        template: ['<a ng-click="markWatched()" class="glyphicon" tooltip="{{tooltip}}" ng-class="{ \'glyphicon-eye-open\' : episode.watched ==  1, \'glyphicon-eye-close\' : episode.watched != 1 }" ng-transclude></a>'],
        link: function($scope) {

            $scope.tooltip = null;
            $scope.$watch('episode.watched', function() {
                $scope.tooltip = $scope.episode.watched == 1 ? "You marked this episode as watched at " + new Date($scope.episode.watchedAt).toLocaleString() : "Mark this episode as watched";
            });
            $scope.markWatched = function() {

                $scope.episode.watched = $scope.episode.watched == '1' ? '0' : '1';
                $scope.episode.watchedAt = new Date().getTime();

                CRUD.FindOne('Episode', {
                    ID: $scope.episode.ID_Episode
                }).then(function(epi) {

                    epi.set('watched', $scope.episode.watched);
                    epi.set('watchedAt', $scope.episode.watchedAt);

                    epi.Persist();
                    $rootScope.$broadcast('calendar:clearcache');
                });
                $scope.$digest();
            }
        }
    }
})