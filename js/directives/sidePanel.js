DuckieTV.factory('SidePanelState', ["$rootScope", function($rootScope) {

    var service = {
        state: {
            isShowing: false,
            isExpanded: false
        },
        show: function() {
            if (document.body.scrollHeight > window.innerHeight) {
                document.body.style.overflowY = 'auto';
            }
            document.body.scrollTop = 0;

            service.contract();
            if (!service.state.isShowing) {
                document.body.classList.add('sidepanelActive');
                service.state.isShowing = true;
                $rootScope.$broadcast("sidepanel:stateChange", true);
            }
        },
        hide: function() {
            document.body.style.overflowY = '';
            service.contract();
            if (service.state.isShowing) {
                service.state.isShowing = false;
                document.body.classList.remove('sidepanelActive');
                $rootScope.$broadcast("sidepanel:stateChange", false);
            }
        },
        expand: function() {
            if (!service.state.isExpanded) {
                document.body.classList.add('sidepanelExpanded');
                service.state.isExpanded = true;
                $rootScope.$broadcast("sidepanel:sizeChange", true);
            }
        },
        contract: function() {
            if (service.state.isExpanded) {
                document.body.classList.remove('sidepanelExpanded');
                service.state.isExpanded = false;
                $rootScope.$broadcast("sidepanel:sizeChange", false);
            }
        }
    };
    return service;
}])

.directive('sidepanel', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/sidepanel/sidepanel.html',
        controllerAs: 'panel',
        bindToController: true,
        transclude: true,

        controller: ["$rootScope", "$scope", "SidePanelState", function($rootScope, $scope, SidePanelState) {
            var panel = this;

            this.isShowing = false;
            this.isExpanded = false;

            $rootScope.$on("sidepanel:stateChange", function(evt, showing) {
                panel.isShowing = showing;
            });

            $rootScope.$on("sidepanel:sizeChange", function(evt, expanded) {
                panel.isExpanded = expanded;
            });


            this.toggle = function() {
                this.isShowing ? SidePanelState.hide() : SidePanelState.show();
            };
            this.hide = function() {
                SidePanelState.hide();
            };
        }]
    };
})

/**
 * Click trap directive that catches clicks outside the sidepanel and hides it.
 */
.directive('clicktrap', ["SidePanelState", "$state",
    function(SidePanelState, $state) {
        return {
            restrict: 'E',
            link: function($scope, iElement) {
                iElement[0].onclick = function() {
                    if (SidePanelState.state.isShowing) {
                        Array.prototype.map.call(document.querySelectorAll('#actionbar a'), function(el) {
                            el.classList.remove('active');
                        });
                        var elm = document.querySelector('#actionbar_calendar');
                        elm.classList.add('fastspin');
                        setTimeout(function() {
                            $state.go('calendar').then(function() {
                                setTimeout(function() {
                                    elm.classList.remove('fastspin');
                                }, 500);
                            });
                        });
                    }
                };
            }
        };
    }
]);