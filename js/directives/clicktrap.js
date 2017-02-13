/**
 * Click trap directive that catches clicks outside the sidepanel and hides it.
 */
DuckieTV.directive('clicktrap', ["SidePanelState", "$state",
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