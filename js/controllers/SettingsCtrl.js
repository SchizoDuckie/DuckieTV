angular.module('DuckieTV.controllers.settings', ['DuckieTV.providers.storagesync', 'DuckieTV.providers.eventscheduler'])


.controller('SettingsCtrl', function($scope, $location, $rootScope, FavoritesService, SettingsService, MirrorResolver, TraktTV, $translate, tmhDynamicLocale, EventSchedulerService) {

    $scope.custommirror = SettingsService.get('thepiratebay.mirror');
    $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
    $scope.searchquality = SettingsService.get('torrenting.searchquality');
    $scope.bgopacity = SettingsService.get('background-rotator.opacity');
    $scope.mirrorStatus = [];
    $scope.log = [];
    $scope.hasTopSites = ('topSites' in window.chrome);
    $scope.locale = SettingsService.get('locale');

    $scope.activesettings = 'templates/settings/default.html';

    /**
     * Change the active settings tab
     */
    $scope.setActiveSetting = function(setting) {
        console.log("setting active setting", setting)
        $scope.activesettings = 'templates/settings/' + setting + '.html';
    }

    /**
     * Inject an event to display mirror resolving progress.
     */
    $rootScope.$on('mirrorresolver:status', function(evt, status) {
        $scope.mirrorStatus.unshift(status);
    });

    /**
     * Fire off an event that pushes the current series list into the cloud
     */
    $scope.sync = function() {
        console.log("Synchronizging!");
        $rootScope.$broadcast('storage:update');
    }

    /**
     * Change localization an translations, reloads translation table.
     */
    $scope.setLocale = function(id) {
        $rootScope.setSetting('locale', id);
        $scope.locale = id;
        $rootScope.changeLanguage(id);
    }

    /**
     * Change the default torrent search provider
     */
    $scope.setSearchProvider = function(provider) {
        $scope.searchprovider = provider;
        SettingsService.set('torrenting.searchprovider', provider);
    }

    /**
     * Changes the default torrent search quality (hdtv, 720p, etc)
     */
    $scope.setSearchQuality = function(quality) {
        console.log("Setting searchquality: ", quality);
        $rootScope.setSetting('torrenting.searchquality', quality);
        $scope.searchquality = quality;
    }

    /**
     * Set the various background opacity levels.
     */
    $scope.setBGOpacity = function(opacity) {
        $rootScope.setSetting('background-rotator.opacity', opacity);
        $scope.bgopacity = opacity;
    }

    /**
     * Resolve a new random ThePirateBay mirror.
     * Log progress hil this is happening.
     * Save the new mirror in the thepiratebay.mirror settings key
     */
    $scope.findRandomTPBMirror = function() {
        MirrorResolver.findTPBMirror().then(function(result) {
            $scope.custommirror = result;
            SettingsService.set('thepiratebay.mirror', $scope.custommirror);
            $rootScope.$broadcast('mirrorresolver:status', 'Saved!');
        }, function(err) {
            console.debug("Could not find a working TPB mirror!", err);
        })
    }

    /**
     * Validate a mirror by checking if it doesn't proxy all links and supports magnet uri's
     */
    $scope.validateCustomMirror = function(mirror) {
        $scope.mirrorStatus = [];
        MirrorResolver.verifyMirror(mirror).then(function(result) {
            $scope.custommirror = result;
            SettingsService.set('thepiratebay.mirror', $scope.custommirror);
            $rootScope.$broadcast('mirrorresolver:status', 'Saved!');
        }, function(err) {
            console.log("Could not validate custom mirror!", mirror);
            //$scope.customMirror = '';
        })
    }


    /**
     * Create the automated download service.
     * This fires the episode:aired:check timer that the kicks it off in the background page
     */
    $scope.enableAutoDownload = function() {
        SettingsService.set('torrenting.autodownload', true);
        EventSchedulerService.createInterval(' ☠ Automated torrent download service', 1, 'episode:aired:check', {});
    }

    /**
     * Remove the auto-download event
     */
    $scope.disableAutoDownload = function() {
        SettingsService.set('torrenting.autodownload', false);
        EventSchedulerService.clear(' ☠ Automated torrent download service');
    }


    $scope.favorites = FavoritesService.favorites;
    $scope.$on('favorites:updated', function(event, data) {
        $rootScope.$broadcast('background:load', FavoritesService.favorites[Math.floor(Math.random() * FavoritesService.favorites.length)].fanart);

    });


});