/** 
 * The <episode-watched> directive shows the eye icon that marks an episode as watched.
 * Eye becomes green and not striked through when it's watched.
 */
DuckieTV.directive('episodeWatched', ["$filter", "$document", "$injector",
    function($filter, $document, $injector) {
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            templateUrl: function($node, $iAttrs) {
                return $iAttrs.templateUrl || "templates/episodeWatched.html";
            },
            link: function($scope) {

                $scope.tooltip = null;

                /**
                 * Translates the watchedAt tooltip
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
                    if (parseInt(episode.watched) == 1) {
                        episode.markNotWatched($injector.get('$rootScope'));
                    } else {
                        episode.markWatched($injector.get('$rootScope'));
                    }
                };
            }
        };
    }
]);