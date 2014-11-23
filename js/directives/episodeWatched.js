angular.module('DuckieTV.directives.episodewatched', [])

/** 
 * The <episode-watched> directive shows the eye icon that marks an episode as watched.
 * Eye becomes green and not striked through when it's watched.
 */
.directive('episodeWatched', function($filter, $document, $injector) {
    return {
        restrict: 'E',
        transclude: true,
        template: ['<a ng-click="markWatched(episode)" style="width:100%" class="glyphicon" tooltip="{{getToolTip(episode)}}" ng-class="{ \'glyphicon-eye-open\' : episode.watched == 1, \'glyphicon-eye-close\' : episode.watched !== 1 }" ng-transclude></a>'],
        link: function($scope) {

            $scope.tooltip = null;

            /**
             * Translate the watchedAt tooltip
             */
            $scope.getToolTip = function(episode) {
                return parseInt(episode.watched) == 1 ?
                    $filter('translate')('EPISODEWATCHEDjs/is-marked/lbl') +
                    $filter('date')(new Date(episode.watchedAt), 'medium') :
                    $filter('translate')('EPISODEWATCHEDjs/not-marked/lbl');
            };

            /**
             * Pass the logic to the episode to handle marking watched in a generic way
             */
            $scope.markWatched = function(episode) {
                console.log("Mark as watched!", episode);
                if (parseInt(episode.watched) == 1) {
                    episode.markNotWatched($injector.get('$rootScope'));
                    console.log("mark not watched");
                } else {
                    episode.markWatched($injector.get('$rootScope'));
                    console.log('mark watched!');
                }
                console.log($scope.episode.watched, $scope.episode.watchedAt);
            };
        }
    };
});