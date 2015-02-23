angular.module('DuckieTV.directives.sidepanel', ['DuckieTV.providers.favorites', 'DuckieTV.providers.episodeaired'])
    .factory('SidePanelState', function() {

        var service = {
            state: {
                isShowing: false,
                isExpanded: false
            },
            show: function() {
                service.state.isShowing = true;
                service.state.isExpanded = false;
            },
            hide: function() {
                service.contract();
                service.state.isShowing = false;
            },
            expand: function() {
                service.state.isExpanded = true;
            },
            contract: function() {
                service.state.isExpanded = false;
            }
        };
        return service;
    })
    .directive('sidepanel', function() {
        return {
            restrict: 'E',
            templateUrl: 'templates/sidepanel/sidepanel.html',
            controllerAs: 'panel',
            bindToController: true,
            transclude: true,

            controller: function($rootScope, $scope, SidePanelState) {
                var panel = this;

                this.isShowing = false;
                this.isExpanded = false;

                console.log('sidepanel state ', SidePanelState)
                Object.observe(SidePanelState.state, function(newValue) {
                    panel.isShowing = newValue[0].object.isShowing;
                    panel.isExpanded = newValue[0].object.isExpanded;
                    console.log("Sidepanelstate param changed!", newValue[0].object);
                    $scope.$applyAsync();

                })
                if (SidePanelState.state.isShowing) {
                    console.log("SidepanelState showing!");
                    this.isShowing = true;
                }
                if (SidePanelState.state.isExpanded) {
                    console.log("SidepanelState expanded!");
                    this.isExpanded = true;
                }

                this.toggle = function() {
                    this.isShowing ? SidePanelState.hide() : SidePanelState.show();
                };
                this.hide = function() {
                    SidePanelState.hide();
                };
            }
        }
    })