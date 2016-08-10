/** 
 * The <episode-watched> directive shows the eye icon that marks an episode as watched.
 * Eye becomes green and not striked through when it's watched.
 */
DuckieTV.directive('episodeWatched', ["$filter", "$document", "$injector",
    function($filter, $document, $injector) {
        var is_marked_lbl = $filter('translate')('EPISODEWATCHEDjs/is-marked/lbl');
        var not_marked_lbl = $filter('translate')('COMMON/not-marked/lbl');
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            templateUrl: function($node, $iAttrs) {
                return $iAttrs.templateUrl || "templates/episodeWatched.html";
            },
            link: function($scope) {

                /**
                 * Translates the watchedAt tooltip
                 */
                $scope.getWToolTip = function(episode) {
                    return episode.isWatched() ? is_marked_lbl + $filter('date')(new Date(episode.watchedAt), 'medium') : not_marked_lbl;
                };

                /**
                 * Pass the logic to the episode to handle marking watched in a generic way
                 */
                $scope.markWatched = function(episode) {
                    if (episode.isWatched()) {
                        episode.markNotWatched($injector.get('$rootScope'));
                    } else {
                        episode.markWatched($injector.get('SettingsService').get('episode.watched-downloaded.pairing'),$injector.get('$rootScope'));
                    }
                };
            }
        };
    }
]);