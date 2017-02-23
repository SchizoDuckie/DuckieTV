/**
 * The <calendar> directive is just a little wrapper around the 3rd party datePicker directive
 * that provides the calendar basics.
 *
 * It sets up the defaults and initializes the calendar.
 */
DuckieTV.directive('calendar', function() {
    return {
        restrict: 'E',
        template: function(element, attrs) {
            return '<div date-picker ' +
                (attrs.eventService ? 'event-service="' + attrs.eventService + '"' : '') +
                (attrs.view ? 'view="' + attrs.view + '" ' : 'view="week"') +
                (attrs.template ? 'template="' + attrs.template + '" ' : '') +
                'min-view="' + (attrs.minView || 'date') + '"' + '></div>';
        },
        link: function($scope, iElement) {
            $scope.views = ['year', 'month', 'week', 'date'];
            $scope.view = 'week';

            var calendar = iElement[0].querySelector('div[date-picker]');

            $scope.zoom = function(spaceToTheRight) {
                var cw = document.body.clientWidth;
                var avail = cw - spaceToTheRight;
                var zoom = avail / cw;
                calendar.style.transform = 'scale(' + zoom + ')';
                calendar.setAttribute('class', (zoom < 1) ? 'zoom' : '');
            }


        },
        controller: ["$rootScope", "$scope", "SidePanelState", "SeriesListState", "SeriesAddingState", function($rootScope, $scope, SidePanelState, SeriesListState, SeriesAddingState) {
            var calendar = this;
            this.isShowing = false;
            this.isExpanded = false;

            $rootScope.isPanelOpen = function() {
                return (!SeriesListState.state.isShowing && !SeriesAddingState.state.isShowing) ? false : true;
            }

            function zoom() {
                if (calendar.isExpanded) {
                    $scope.zoom(840);
                } else if (calendar.isShowing) {
                    $scope.zoom(450);
                } else {
                    $scope.zoom(0);
                }
                $scope.$applyAsync();
            };

            /**
             * Hide the calendar (performance and weirds scrollbars) when the serieslist
             */
            $rootScope.$on("sidepanel:stateChange", function(event, state) {
                calendar.isShowing = state;
                //console.debug("Sidepanel statechange from calendar:", event, state);
                zoom();
            });

            $rootScope.$on("sidepanel:sizeChange", function(event, expanded) {
                calendar.isExpanded = expanded;
                //console.debug("Sidepanel sizechange from calendar:", event, expanded);
                zoom();
            })

            $rootScope.$on("serieslist:stateChange", function(event, state) {
                calendar.isShowing = !state;
                //console.debug("Calendar statechange from fav panels:", event, state);
                zoom();
            })


            window.addEventListener('resize', zoom);
        }]
    }
});