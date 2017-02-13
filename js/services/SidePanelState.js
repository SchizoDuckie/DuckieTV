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
}]);