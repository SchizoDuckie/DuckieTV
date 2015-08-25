/** 
 * The focus watch directive checks if the focusWatch property that's been set on the scope changes
 * and then executes a .focus() on the element.
 * Example: <input focus-watch='test'>
 * controller: $scope.test = true; // autofocus the element.
 */
DuckieTV.directive('focusWatch', function() {
    return {
        restrict: 'AC',
        scope: '=',
        link: function($scope, element) {
            if (element[0].getAttribute('focus-watch')) {
                if (navigator.userAgent.toLowerCase().match(/iPhone|iPad|Android/i)) {
                    return;
                }
                $scope.$watch(element[0].getAttribute('focus-watch'), function() {
                    var el = element.length == 1 && element[0].tagName == 'INPUT' ? element[0] : element.find('input')[0];
                    setTimeout(function() {
                        this.focus();
                    }.bind(el), 500);
                });
            }
        }
    };
});