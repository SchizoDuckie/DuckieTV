/** 
 * The <episode-downloaded> directive shows the floppy-disk icon that marks an episode as downloaded.
 * Floppy-saved becomes green when it's downloaded.
 */
DuckieTV.directive('episodeDownloaded', ["$filter", "$document", "$injector",
    function($filter, $document, $injector) {
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            templateUrl: function($node, $iAttrs) {
                return $iAttrs.templateUrl || "templates/episodeDownloaded.html";
            },
            link: function($scope) {

                /**
                 * Translates the downloaded tooltip
                 */
                $scope.getDToolTip = function(episode) {
                    return episode.isDownloaded() ?
                        $filter('translate')('EPISODEDOWNLOADEDjs/is-downloaded/lbl') :
                        $filter('translate')('EPISODEDOWNLOADEDjs/not-downloaded/lbl');
                };

                /**
                 * Pass the logic to the episode to handle marking downloaded in a generic way
                 */
                $scope.markDownloaded = function(episode) {
                    if (episode.isDownloaded()) {
                        episode.markNotDownloaded($injector.get('$rootScope'));
                    } else {
                        episode.markDownloaded($injector.get('$rootScope'));
                    }
                };
            }
        };
    }
]);