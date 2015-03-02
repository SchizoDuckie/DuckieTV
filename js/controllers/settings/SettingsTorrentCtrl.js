/**
 * Controller for the torrent settings tab
 */
DuckieTV.controller('SettingsTorrentCtrl', ["$scope", "$rootScope", "SettingsService", "KickassMirrorResolver", "ThePirateBayMirrorResolver", "TraktTVv2", "EpisodeAiredService",

    function($scope, $rootScope, SettingsService, KickassMirrorResolver, ThePirateBayMirrorResolver, TraktTVv2, EpisodeAiredService) {

        $scope.log = [];

        $scope.customkatmirror = SettingsService.get('KickAssTorrents.mirror');
        $scope.customtpbmirror = SettingsService.get('ThePirateBay.mirror');
        $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
        $scope.searchquality = SettingsService.get('torrenting.searchquality');
        $scope.adPeriod = SettingsService.get('autodownload.period');
        $scope.adMinSeeders = SettingsService.get('autodownload.minSeeders');
        $scope.customadPeriod = SettingsService.get('autodownload.period');
        $scope.customadMinSeeders = SettingsService.get('autodownload.minSeeders');
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
            EpisodeAiredService.attach();
        };

        /**
         * Remove the auto-download event
         */
        $scope.disableAutoDownload = function() {
            SettingsService.set('torrenting.autodownload', false);
            EpisodeAiredService.detach();
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

        /**
         * Changes the period allowed to AutoDownload episodes
         */
        $scope.setadPeriod = function(period) {
            SettingsService.set('autodownload.period', period);
            $scope.adPeriod = period;
            EpisodeAiredService.detach(); // restart kickoff method when changing search period and seeders.
            EpisodeAiredService.attach();
        };

        /**
         * Changes the amount of seeders required for AutoDownload
         */
        $scope.setadMinSeeders = function(seeds) {
            SettingsService.set('autodownload.minSeeders', seeds);
            $scope.adMinSeeders = seeds;
            EpisodeAiredService.detach(); // restart kickoff method when changing search period and seeders.
            EpisodeAiredService.attach();

        };

    }
])