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
        controller: ["$scope", "SidePanelState", function($scope, SidePanelState) {
            var calendar = this;
            this.isShowing = false;
            this.isExpanded = false;
            Object.observe(SidePanelState.state, function(newValue) {
                if (newValue[0].object.isExpanded) {
                    calendar.isExpanded = true;
                    $scope.zoom(840);
                } else if (newValue[0].object.isShowing) {
                    calendar.isShowing = true;
                    $scope.zoom(450);
                } else {
                    calendar.isExpanded = calendar.isShowing = false;

                    $scope.zoom(0);
                }
                $scope.$applyAsync();
            });

            window.addEventListener('resize', function() {
                if (calendar.isExpanded) {
                    $scope.zoom(840);
                } else if (calendar.isShowing) {
                    $scope.zoom(450);
                }
                $scope.$applyAsync();
            });
        }]
    };
});