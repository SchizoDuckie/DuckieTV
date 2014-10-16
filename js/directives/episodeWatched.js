angular.module('DuckieTV.directives.episodewatched', [])

/** 
 * The <episode-watched> directive shows the eye icon that marks an episode as watched.
 * Eye becomes green and not striked through when it's watched.
 */
.directive('episodeWatched', function($filter, $document, $injector) {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            episode: '=',
            preventBubble: '='
        },
        template: ['<a ng-click="markWatched($event)" style="width:100%" class="glyphicon" tooltip="{{getToolTip()}}" ng-class="{ \'glyphicon-eye-open\' : episode.get(\'watched\') ===  \'1\', \'glyphicon-eye-close\' : episode.get(\'watched\') !== \'1\' }" ng-transclude></a>'],
        link: function($scope) {

            $scope.tooltip = null;
            /**
             * Translate the watchedAt tooltip
             */
            $scope.getToolTip = function() {
                return $scope.episode.get('watched') === '1' ?
                    $filter('translate')('EPISODEWATCHEDjs/is-marked/lbl') +
                    $filter('date')(new Date($scope.episode.get('watchedAt')), 'medium') :
                    $filter('translate')('EPISODEWATCHEDjs/not-marked/lbl');
            };

            /**
             * Pass the logic to the episode to handle marking watched in a generic way
             */
            $scope.markWatched = function($event) {
                if ($scope.episode.get('watched') === '1') {
                    $scope.episode.markNotWatched($injector.get('$rootScope'));
                } else {
                    $scope.episode.markWatched($injector.get('$rootScope'));
                }

                if($scope.preventBubble == 1) {
                    $event.stopPropagation();
                }   
            };
        }
    };
});
