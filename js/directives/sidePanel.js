DuckieTV.directive('sidepanel', function() {
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
});