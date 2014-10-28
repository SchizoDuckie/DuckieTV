angular.module('DuckieTV.controllers.settings', ['DuckieTV.providers.storagesync', 'DuckieTV.providers.eventscheduler'])

.controller('SyncCtrl', function($scope) {


})

.controller('DefaultCtrl', function($scope, StorageSyncService, SettingsService) {

    /**
     * checks if sync is supported, used to hide/show sync panel on settings/display
     */
    $scope.isSyncSupported = function() {
        return false; // StorageSyncService.isSupported();
    };

    /**
     * Fire off an event that pushes the current series list into the cloud
     */
    $scope.sync = function() {
        console.log("Synchronizging!");
        SettingsService.set('lastSync', new Date().getTime());
        StorageSyncService.synchronize();
    };

    $scope.enableSync = function() {
        StorageSyncService.enable().then(function() {
            SettingsService.set('storage.sync', true);
            StorageSyncService.read(); // kick off read.
        }, function() {
            SettingsService.set('storage.sync', false);
        });
    };

    $scope.disableSync = function() {
        StorageSyncService.disable().finally(function() {
            SettingsService.set('storage.sync', false);
        });
    };

})

.controller('DisplayCtrl', function($scope, $rootScope, $filter, SettingsService) {

    $scope.activeLocale = SettingsService.get('application.locale');

    /*
     * set up the language list used in settings/display template
     */
    $scope.languageList = {
        'en_au': 'au',
        'en_nz': 'nz',
        'en_uk': 'uk',
        'en_us': 'us',
        'de_de': 'de_de',
        'es_419': 'es_419',
        'es_es': 'es_es',
        'fr_fr': 'fr_fr',
        'it_it': 'it_it',
        'ja_jp': 'ja_jp',
        'ko_kr': 'ko_kr',
        'nl_nl': 'nl_nl',
        'pt_pt': 'pt_pt',
        'ru_ru': 'ru_ru',
        'sv_se': 'sv_se',
        'zh_cn': 'zh_cn'
    };

    /**
     * Set the various background opacity levels.
     */
    $scope.setBGOpacity = function(opacity) {
        SettingsService.set('background-rotator.opacity', opacity);
        $scope.bgopacity = opacity;
    };

    /**
     * Change localization an translations, reloads translation table.
     */
    $scope.setLocale = function(lang) {
        SettingsService.changeLanguage(lang);
        $scope.activeLocale = lang;
    };


    /**
     * Enable the calendar to show-specials
     */
    $scope.enableSpecials = function() {
        SettingsService.set('calendar.show-specials', true);
        $rootScope.$broadcast('calendar:clearcache');
    };

    /**
     * Disable the calendar from showing specials
     */
    $scope.disableSpecials = function() {
        SettingsService.set('calendar.show-specials', false);
        $rootScope.$broadcast('calendar:clearcache');
    };

})
    .controller('TorrentCtrl', function($scope, $rootScope, SettingsService, MirrorResolver, EventSchedulerService) {

        $scope.customtpbmirror = SettingsService.get('thepiratebay.mirror');
        $scope.customkatmirror = SettingsService.get('kickasstorrents.mirror');
        $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
        $scope.searchquality = SettingsService.get('torrenting.searchquality');
        $scope.bgopacity = SettingsService.get('background-rotator.opacity');
        $scope.tpbmirrorStatus = [];
        $scope.katmirrorStatus = [];

        /**
         * Inject an event to display mirror resolving progress.
         */
        $rootScope.$on('tpbmirrorresolver:status', function(evt, status) {
            $scope.tpbmirrorStatus.unshift(status);
        });

        /**
         * Inject an event to display mirror resolving progress.
         */
        $rootScope.$on('katmirrorresolver:status', function(evt, status) {
            $scope.katmirrorStatus.unshift(status);
        });

        /**
         * Resolve a new random ThePirateBay mirror.
         * Log progress while this is happening.
         * Save the new mirror in the thepiratebay.mirror settings key
         */
        $scope.findRandomTPBMirror = function() {
            MirrorResolver.findTPBMirror().then(function(result) {
                $scope.customtpbmirror = result;
                SettingsService.set('thepiratebay.mirror', $scope.customtpbmirror);
                $rootScope.$broadcast('tpbmirrorresolver:status', 'Saved!');
            }, function(err) {
                console.debug("Could not find a working TPB mirror!", err);
            });
        };

        /**
         * Validate a mirror by checking if it doesn't proxy all links and supports magnet uri's
         */
        $scope.validateCustomTPBMirror = function(mirror) {
            $scope.mirrorStatus = [];
            MirrorResolver.verifyTPBMirror(mirror).then(function(result) {
                $scope.customtpbmirror = result;
                SettingsService.set('thepiratebay.mirror', $scope.customtpbmirror);
                $rootScope.$broadcast('tpbmirrorresolver:status', 'Saved!');
            }, function(err) {
                console.log("Could not validate custom mirror!", mirror);
                //$scope.customMirror = '';
            });
        };

        /**
         * Resolve a new random KickassTorrents  mirror.
         * Log progress while this is happening.
         * Save the new mirror in the kickasstorrents.mirror settings key
         */
        $scope.findRandomKATMirror = function() {
            MirrorResolver.findKATMirror().then(function(result) {
                $scope.customkatmirror = result;
                SettingsService.set('kickasstorrents.mirror', $scope.customkatmirror);
                $rootScope.$broadcast('katmirrorresolver:status', 'Saved!');
            }, function(err) {
                console.debug("Could not find a working KAT mirror!", err);
            });
        };

        /**
         * Validate a mirror by checking if it doesn't proxy all links and supports magnet uri's
         */
        $scope.validateCustomKATMirror = function(mirror) {
            $scope.mirrorStatus = [];
            MirrorResolver.verifyKATMirror(mirror).then(function(result) {
                $scope.customkatmirror = result;
                SettingsService.set('kickasstorrents.mirror', $scope.customkatmirror);
                $rootScope.$broadcast('katmirrorresolver:status', 'Saved!');
            }, function(err) {
                console.log("Could not validate custom mirror!", mirror);
                //$scope.customMirror = '';
            });
        };

        /**
         * Create the automated download service.
         * This fires the episode:aired:check timer that the kicks it off in the background page
         */
        $scope.enableAutoDownload = function() {
            SettingsService.set('torrenting.autodownload', true);
            EventSchedulerService.createInterval(' ☠ Automated torrent download service', 120, 'episode:aired:check', {});
        };

        /**
         * Remove the auto-download event
         */
        $scope.disableAutoDownload = function() {
            SettingsService.set('torrenting.autodownload', false);
            EventSchedulerService.clear(' ☠ Automated torrent download service');
        };

        /**
         * Change the default torrent search provider
         */
        $scope.setSearchProvider = function(provider) {
            $scope.searchprovider = provider;
            SettingsService.set('torrenting.searchprovider', provider);
        };

        /**
         * Changes the default torrent search quality (hdtv, 720p, etc)
         */
        $scope.setSearchQuality = function(quality) {
            console.log("Setting searchquality: ", quality);
            SettingsService.setSetting('torrenting.searchquality', quality);
            $scope.searchquality = quality;
        };

    })
    .controller('SettingsCtrl', function($scope, $rootScope, $routeParams, FavoritesService, SettingsService, MirrorResolver, TraktTV, EventSchedulerService, $filter) {

        $scope.log = [];
        $scope.hasTopSites = ('topSites' in window.chrome);

        $scope.activesettings = 'templates/settings/default.html';

        $scope.tab = $routeParams.tab;
        $scope.activeTab = 'templates/settings/' + $routeParams.tab + '.html';

        $scope.favorites = FavoritesService.favorites;
    });