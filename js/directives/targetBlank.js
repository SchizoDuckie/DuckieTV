/**
 * Directive that only gets loaded when we're in nw.js (node-webkit) context.
 * This captures all target='_blank' links and opens them in the default external browser
 * so that we don't create new windows inside DuckieTV unintentionally.
 */

if (navigator.userAgent.toLowerCase().indexOf('standalone') !== -1) {

    DuckieTV.directive('target', function() {
        return {
            restrict: 'A',
            scope: '=',
            link: function($scope, element) {
                if (element[0].getAttribute('target') && element[0].getAttribute('target').toLowerCase() == '_blank') {
                    element[0].addEventListener('click', function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                        require('nw.gui').Shell.openExternal(element[0].getAttribute('href'));
                        return false;
                    });
                }

            }
        };
    });

}