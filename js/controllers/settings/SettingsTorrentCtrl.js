/**
 * Controller for the torrent settings tab
 */
DuckieTV.controller('SettingsTorrentCtrl', ["$scope", "$rootScope", "SettingsService", "DuckieTorrent", "TorrentSearchEngines", "KickassMirrorResolver", "ThePirateBayMirrorResolver", "TraktTVv2", "AutoDownloadService",
    function($scope, $rootScope, SettingsService, DuckieTorrent, TorrentSearchEngines, KickassMirrorResolver, ThePirateBayMirrorResolver, TraktTVv2, AutoDownloadService) {

        $scope.log = [];

        $scope.customkatmirror = SettingsService.get('KickAssTorrents.mirror');
        $scope.customtpbmirror = SettingsService.get('ThePirateBay.mirror');
        $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
        $scope.searchquality = SettingsService.get('torrenting.searchquality');

        $scope.torrentEnabled = SettingsService.get('torrenting.enabled');
        $scope.allowUnsafe = SettingsService.get('proxy.allowUnsafe');
        $scope.directoryEnabled = SettingsService.get('torrenting.directory');
        $scope.streamingEnabled = SettingsService.get('torrenting.streaming');
        $scope.progressEnabled = SettingsService.get('torrenting.progress');
        $scope.autostopEnabled = SettingsService.get('torrenting.autostop');
        $scope.autostopAllEnabled = SettingsService.get('torrenting.autostop_all');
        $scope.adEnabled = SettingsService.get('torrenting.autodownload');
        $scope.adPeriod = SettingsService.get('autodownload.period');
        $scope.adMinSeeders = SettingsService.get('autodownload.minSeeders');

        $scope.katmirrorStatus = [];
        $scope.tpbmirrorStatus = [];

        $scope.searchProviders = Object.keys(TorrentSearchEngines.getSearchEngines());

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

        $scope.toggleTorrent = function() {
            $scope.torrentEnabled = !$scope.torrentEnabled;
            SettingsService.set('torrenting.enabled', $scope.torrentEnabled);
            window.location.reload();
        };

        $scope.toggleUnsafeProxy = function() {
            $scope.allowUnsafe = !$scope.allowUnsafe;
            SettingsService.set('proxy.allowUnsafe', $scope.allowUnsafe);
        };

        $scope.toggleDirectory = function() {
            $scope.directoryEnabled = !$scope.directoryEnabled;
            SettingsService.set('torrenting.directory', $scope.directoryEnabled);
        };

        $scope.toggleProgress = function() {
            $scope.progressEnabled = !$scope.progressEnabled;
            SettingsService.set('torrenting.progress', $scope.progressEnabled);
        };

        $scope.toggleStreaming = function() {
            $scope.streamingEnabled = !$scope.streamingEnabled;
            SettingsService.set('torrenting.streaming', $scope.streamingEnabled);
        };

        $scope.toggleAutoStop = function() {
            $scope.autostopEnabled = !$scope.autostopEnabled;
            SettingsService.set('torrenting.autostop', $scope.autostopEnabled);
        };

        $scope.toggleAutoStopAll = function() {
            $scope.autostopAllEnabled = !$scope.autostopAllEnabled;
            SettingsService.set('torrenting.autostop_all', $scope.autostopAllEnabled);
        };

        $scope.toggleAutoDownload = function() {
            if ($scope.adEnabled == true) {
                SettingsService.set('torrenting.autodownload', false);
                $scope.adEnabled = false;
                AutoDownloadService.detach();
            } else {
                SettingsService.set('torrenting.autodownload', true);
                $scope.adEnabled = true;
                AutoDownloadService.attach();
            }
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
        $scope.saveADPeriod = function(period) {
            SettingsService.set('autodownload.period', period);
            AutoDownloadService.detach(); // restart kickoff method when changing search period and seeders.
            AutoDownloadService.attach();
        };

        /**
         * Changes the amount of seeders required for AutoDownload
         */
        $scope.saveADMinSeeders = function(seeds) {
            SettingsService.set('autodownload.minSeeders', seeds);
            AutoDownloadService.detach(); // restart kickoff method when changing search period and seeders.
            AutoDownloadService.attach();

        };

        $scope.isuTorrentAuthenticated = function() {
            return localStorage.getItem('utorrent.token') !== null;
        };

        $scope.getToken = function() {
            return localStorage.getItem('utorrent.token');
        };

        $scope.removeToken = function() {
            localStorage.removeItem('utorrent.token');
        };

        $scope.connect = function() {
            localStorage.removeItem('utorrent.preventconnecting');
            DuckieTorrent.getClient().AutoConnect();
        };

        $scope.getTorrentClients = function() {
            return Object.keys(DuckieTorrent.getClients());
        };

        $scope.setTorrentClient = function(name) {
            localStorage.setItem('torrenting.client', name);
            SettingsService.set('torrenting.client', name); // for use in templates
            DuckieTorrent.getClient().Disconnect();
            $scope.currentClient = name;
            $scope.connect();
        };

        $scope.currentClient = localStorage.getItem('torrenting.client');

        $scope.reload = function() {
            window.location.reload();
        };

    }
])