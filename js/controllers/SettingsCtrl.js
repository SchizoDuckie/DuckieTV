angular.module('DuckieTV.controllers.settings', ['DuckieTV.providers.storagesync', 'DuckieTV.providers.trakttvv2'])

/**
 * Setting controller for the settings pages
 *
 * Contains various controllers for different settings tabs
 */

/**
 * Controller for Sync settings tab
 */
.controller('SyncCtrl', function($scope, StorageSyncService, $injector, TraktTVv2) {

    $scope.targets = StorageSyncService.targets;

    $scope.read = function(StorageEngine) {
        StorageEngine.getSeriesList().then(function(result) {
            StorageEngine.series = [];
            result.map(function(TVDB_ID) {
                return TraktTVv2.resolveTVDBID(TVDB_ID).then(function(searchResult) {
                    return TraktTVv2.serie(searchResult.slug_id);
                }).then(function(serie) {
                    StorageEngine.series.push(serie);
                });
            });
        });
    };

    $scope.compare = function(StorageEngine) {
        StorageSyncService.compareTarget(StorageEngine, true);
    };

    console.log($scope.targets);
})

/**
 * Controller for main settings tab
 */
.controller('DefaultCtrl', function($scope, StorageSyncService, SettingsService) {
// Nothing here D:

// Deprecated sync functions, no longer relevant to this settings tab
/**
    //Checks if sync is supported, used to hide/show sync panel on settings/display
    $scope.isSyncSupported = function() {
        return false; // StorageSyncService.isSupported();
    };

    //Fire off an event that pushes the current series list into the cloud
    $scope.sync = function() {
        console.log("Synchronizing!");
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
*/
})

/*
 * Controller for the display settings tab
 */
.controller('DisplayCtrl', function($scope, $rootScope, $filter, SettingsService) {

    $scope.activeLocale = SettingsService.get('application.locale');
    $scope.bgopacity = SettingsService.get('background-rotator.opacity');
    $scope.showSpecials = SettingsService.get('calendar.show-specials');

    // Set up the language list used in settings/display template
    $scope.languageList = {
        'en_au': 'au',
        'en_ca': 'ca',
        'en_nz': 'nz',
        'en_uk': 'uk',
        'en_us': 'us',
        'de_de': 'de_de',
        'es_419': 'es_419',
        'es_es': 'es_es',
        'fr_ca': 'fr_ca',
        'fr_fr': 'fr_fr',
        'it_it': 'it_it',
        'ja_jp': 'ja_jp',
        'ko_kr': 'ko_kr',
        'nl_nl': 'nl_nl',
        'pt_br': 'pt_br',
        'pt_pt': 'pt_pt',
        'ru_ru': 'ru_ru',
        'sv_se': 'sv_se',
        'zh_cn': 'zh_cn'
    };

    // Change localization an translations, reloads translation table.
    $scope.setLocale = function(lang) {
        SettingsService.changeLanguage(lang);
        $scope.activeLocale = lang;
    };

    // Set the various background opacity levels.
    $scope.setBGOpacity = function(opacity) {
        SettingsService.set('background-rotator.opacity', opacity);
        $scope.bgopacity = opacity;
    };

    // Toggle if calendar shows specials or not
    $scope.toggleSpecials = function() {
        if ($scope.showSpecials == true) {
            SettingsService.set('calendar.show-specials', false);
            $scope.showSpecials = false;
        } else {
            SettingsService.set('calendar.show-specials', true);
            $scope.showSpecials = true;
        }
        $rootScope.$broadcast('calendar:clearcache');
    };
})

/**
 * Controller for the torrent settings tab
 */
.controller('SettingsTorrentCtrl', function($scope, $rootScope, SettingsService, KickassMirrorResolver, TraktTVv2) {

    $scope.log = [];

    $scope.customkatmirror = SettingsService.get('kickasstorrents.mirror');
    $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
    $scope.searchquality = SettingsService.get('torrenting.searchquality');
    $scope.katmirrorStatus = [];

    $scope.searchProviders = Object.keys(SettingsService.get('torrenting.genericClients'));

    /**
     * Inject an event to display mirror resolving progress.
     */
    $rootScope.$on('katmirrorresolver:status', function(evt, status) {
        $scope.katmirrorStatus.unshift(status);
    });

    /**
     * Resolve a new random KickassTorrents  mirror.
     * Log progress while this is happening.
     * Save the new mirror in the kickasstorrents.mirror settings key
     */
    $scope.findRandomKATMirror = function() {
        KickassMirrorResolver.findKATMirror().then(function(result) {
            $scope.customkatmirror = result;
            SettingsService.set('kickasstorrents.mirror', $scope.customkatmirror);
            $rootScope.$broadcast('katmirrorresolver:status', 'Saved!');
        }, function(err) {
            console.error("Could not find a working KAT mirror!", err);
        });
    };

    /**
     * Validate a mirror by checking if it doesn't proxy all links and supports magnet uri's
     */
    $scope.validateCustomKATMirror = function(mirror) {
        $scope.mirrorStatus = [];
        KickassMirrorResolver.verifyKATMirror(mirror).then(function(result) {
            $scope.customkatmirror = result;
            SettingsService.set('kickasstorrents.mirror', $scope.customkatmirror);
            $rootScope.$broadcast('katmirrorresolver:status', 'Saved!');
        }, function(err) {
            console.error("Could not validate custom mirror!", mirror);
            //$scope.customMirror = '';
        });
    };

    /**
     * Create the automated download service.
     * This fires the episode:aired:check timer that the kicks it off in the background page
     */
    $scope.enableAutoDownload = function() {
        SettingsService.set('torrenting.autodownload', true);
        setTimeout(function() {
            $rootScope.$broadcast('episode:aired:check');
        }, 1000);
    };

    /**
     * Remove the auto-download event
     */
    $scope.disableAutoDownload = function() {
        SettingsService.set('torrenting.autodownload', false);
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
        SettingsService.set('torrenting.searchquality', quality);
        $scope.searchquality = quality;
    };

})

/** 
 * Root controller for settings pages
 */
.controller('SettingsCtrl', function($scope, $rootScope, $routeParams, FavoritesService, SettingsService, KickassMirrorResolver, TraktTVv2, $filter) {

    $scope.hasTopSites = ('chrome' in window && 'topSites' in window.chrome);

    $scope.activesettings = 'templates/settings/default.html';

    $scope.tab = $routeParams.tab;
    $scope.activeTab = 'templates/settings/' + $routeParams.tab + '.html';

    $scope.favorites = FavoritesService.favorites;
});