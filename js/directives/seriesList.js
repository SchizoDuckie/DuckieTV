DuckieTV.directive('seriesList', function(SidePanelState) {
    return {
        restrict: 'E',
        controller: 'seriesListCtrl',
        link: function($scope, iElement, iAttrs, controller) {

            function setWidthMinus(minus) {
                document.querySelector('series-list > div').style.width = (document.body.clientWidth - minus) + 'px';
            };

            Object.observe(SidePanelState.state, function(newValue) {
                if (newValue[0].object.isExpanded) {
                    setWidthMinus(800);
                } else if (newValue[0].object.isShowing) {
                    setWidthMinus(400);
                } else {
                    setWidthMinus(0)
                }
                $scope.$applyAsync();
            });

            window.addEventListener('resize', function() {
                console.log('window resize!');
                if (SidePanelState.state.isExpanded) {
                    setWidthMinus(800);

                } else if (SidePanelState.isShowing) {
                    setWidthMinus(400);
                } else {
                    setWidthMinus(0);
                }
                $scope.$applyAsync();
            }, false);
        }
    }
})