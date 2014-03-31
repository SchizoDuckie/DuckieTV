angular.module('DuckieTV.providers.piratebayChecker', ['DuckieTV.providers.notifications', 'DuckieTV.providers.thepiratebay'])

.provider('PirateBayCheckerService', function() {

    //  $rootScope.$on()
    this.$get = function(NotificationService, ThePirateBay) {
        return {};

    }




})