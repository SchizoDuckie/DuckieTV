angular.module('DuckieTV.controllers.settings', ['DuckieTV.providers.storagesync', 'DuckieTV.providers.trakttvv2', 'DuckieTV.providers.tpbmirrorresolver'])

/**
 * Setting controller for the settings pages
 *
 * Contains various controllers for different settings tabs
 */

/**
 * Controller for Sync settings tab
 */
.controller('SyncCtrl', ["$scope", "StorageSyncService", "$injector", "TraktTVv2", function($scope, StorageSyncService, $injector, TraktTVv2) {

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
}])


/*
 * Controller for the display settings tab
 */
.controller('DisplayCtrl', ["$scope", "$rootScope", "$filter", "SettingsService", function($scope, $rootScope, $filter, SettingsService) {
	
	$scope.hasTopSites = ('chrome' in window && 'topSites' in window.chrome);
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
}])

/**
 * Controller for the torrent settings tab
 */
.controller('SettingsTorrentCtrl', ["$scope", "$rootScope", "SettingsService", "KickassMirrorResolver", "ThePirateBayMirrorResolver", "TraktTVv2", function($scope, $rootScope, SettingsService, KickassMirrorResolver, ThePirateBayMirrorResolver, TraktTVv2) {

    $scope.log = [];

    $scope.customkatmirror = SettingsService.get('KickAssTorrents.mirror');
    $scope.customtpbmirror = SettingsService.get('ThePirateBay.mirror');
    $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
    $scope.searchquality = SettingsService.get('torrenting.searchquality');
    $scope.katmirrorStatus = [];
    $scope.tpbmirrorStatus = [];

    $scope.searchProviders = Object.keys(window.TorrentSearchProviders);

    /**
     * Inject an event to display mirror resolving progress.
     */
    $rootScope.$on('katmirrorresolver:status', function(evt, status) {
        $scope.katmirrorStatus.unshift(status);
    });
    $rootScope.$on('tpbmirrorresolver:status', function(evt, status) {
        $scope.tpbmirrorStatus.unshift(status);
    });

    /**
     * Resolve a new random KickassTorrents  mirror.
     * Log progress while this is happening.
     * Save the new mirror in the kickasstorrents.mirror settings key
     */
    $scope.findRandomKATMirror = function() {
        KickassMirrorResolver.findKATMirror().then(function(result) {
            $scope.customkatmirror = result;
            SettingsService.set('KickAssTorrents.mirror', $scope.customkatmirror);
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
            SettingsService.set('KickAssTorrents.mirror', $scope.customkatmirror);
            $rootScope.$broadcast('katmirrorresolver:status', 'Saved!');
        }, function(err) {
            console.error("Could not validate custom mirror!", mirror);
            //$scope.customMirror = '';
        });
    };

    /**
     * @todo : migrate these to a directive that's a generic interface for mirror resolvers based on the config.MirrorResolver properties
     */

    /*
     * Resolve a new random ThePirateBay mirror.
     * Log progress while this is happening.
     * Save the new mirror in the thepiratebay.mirror settings key
     */
    $scope.findRandomTPBMirror = function() {
        ThePirateBayMirrorResolver.findTPBMirror().then(function(result) {
            $scope.customtpbmirror = result;
            SettingsService.set('ThePirateBay.mirror', $scope.customtpbmirror);
            $rootScope.$broadcast('tpbmirrorresolver:status', 'Saved!');
        }, function(err) {
            console.error("Could not find a working TPB mirror!", err);
        });
    };

    /**
     * Validate a mirror by checking if it doesn't proxy all links and supports magnet uri's
     */
    $scope.validateCustomTPBMirror = function(mirror) {
        $scope.mirrorStatus = [];
        ThePirateBayMirrorResolver.verifyTPBMirror(mirror).then(function(result) {
            $scope.customtpbmirror = result;
            SettingsService.set('ThePirateBay.mirror', $scope.customtpbmirror);
            $rootScope.$broadcast('tpbmirrorresolver:status', 'Saved!');
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

}])

/** 
 * Root controller for settings pages
 */
.controller('SettingsCtrl', ["$scope", "$rootScope", "$routeParams", "FavoritesService", "SettingsService", "KickassMirrorResolver", "TraktTVv2", "$filter", function($scope, $rootScope, $routeParams, FavoritesService, SettingsService, KickassMirrorResolver, TraktTVv2, $filter) {

    $scope.favorites = FavoritesService.favorites;
}]);