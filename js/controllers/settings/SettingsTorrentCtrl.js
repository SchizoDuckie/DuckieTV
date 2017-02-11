/**
 * Controller for the torrent related setting tabs (auto-download, torrent-search, torrent, utorrent)
 */
DuckieTV.controller('SettingsTorrentCtrl', ["$scope", "$rootScope", "$injector", "SettingsService", "DuckieTorrent", "TorrentSearchEngines", "ThePirateBayMirrorResolver", "TraktTVv2", "AutoDownloadService",
    function($scope, $rootScope, $injector, SettingsService, DuckieTorrent, TorrentSearchEngines, ThePirateBayMirrorResolver, TraktTVv2, AutoDownloadService) {

        $scope.log = [];

        $scope.customtpbmirror = SettingsService.get('ThePirateBay.mirror');
        $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
        $scope.searchquality = SettingsService.get('torrenting.searchquality');

        $scope.torrentEnabled = SettingsService.get('torrenting.enabled');
        $scope.allowUnsafe = SettingsService.get('proxy.allowUnsafe');
        $scope.GILmodeAny = SettingsService.get('torrenting.global_include_any');
        $scope.allowTDsortMenu = SettingsService.get('torrentDialog.sortMenu.enabled');
        $scope.directoryEnabled = SettingsService.get('torrenting.directory');
        $scope.streamingEnabled = SettingsService.get('torrenting.streaming');
        $scope.progressEnabled = SettingsService.get('torrenting.progress');
        $scope.autostopEnabled = SettingsService.get('torrenting.autostop');
        $scope.autostopAllEnabled = SettingsService.get('torrenting.autostop_all');
        $scope.adEnabled = SettingsService.get('torrenting.autodownload');
        $scope.adPeriod = SettingsService.get('autodownload.period');
        $scope.adMinSeeders = SettingsService.get('autodownload.minSeeders');
        $scope.chromiumEnabled = SettingsService.get('torrenting.launch_via_chromium');
        $scope.useTD2 = SettingsService.get('torrentDialog.2.enabled');
        $scope.adDelay = SettingsService.get('autodownload.delay').minsToDhm();
        $scope.labelEnabled = SettingsService.get('torrenting.label');
        $scope.isLabelSupported = ($scope.torrentEnabled) ? DuckieTorrent.getClient().isLabelSupported() : false;

        $scope.tpbmirrorStatus = [];

        $scope.searchProviders = Object.keys(TorrentSearchEngines.getSearchEngines());

        $scope.globalInclude = SettingsService.get('torrenting.global_include');
        $scope.globalExclude = SettingsService.get('torrenting.global_exclude');
        $scope.globalSizeMin = SettingsService.get('torrenting.global_size_min');
        $scope.globalSizeMax = SettingsService.get('torrenting.global_size_max');

        $scope.usingMultiSE = SettingsService.get('autodownload.multiSE.enabled');
        $scope.multiSE = SettingsService.get('autodownload.multiSE'); // get multi search engines list previously saved
        $scope.searchProviders.forEach(function(name) {
            // add any new search engines discovered, default them as active.
            if (!(name in $scope.multiSE)) {
                $scope.multiSE[name] = true;
            }
        });
        SettingsService.set('autodownload.multiSE',$scope.multiSE); // save updated multiSE list.

        // save multi Search Engine states
        $scope.saveMultiSE = function() {
            SettingsService.set('autodownload.multiSE',$scope.multiSE);
            AutoDownloadService.detach(); // recycle AD to pick up changes.
            AutoDownloadService.attach();
        };

        /**
         * Toggle the AutoDownload Multi Search Engines usage
         */
        $scope.toggleUsingMultiSE = function() {
            $scope.usingMultiSE = !$scope.usingMultiSE;
            SettingsService.set('autodownload.multiSE.enabled', $scope.usingMultiSE);
            AutoDownloadService.detach(); // recycle AD to pick up changes.
            AutoDownloadService.attach();
        };

        /**
         * Inject an event to display mirror resolving progress.
         */
        $rootScope.$on('tpbmirrorresolver:status', function(evt, status) {
            $scope.tpbmirrorStatus.unshift(status);
        });

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

        $scope.toggleGILmode = function() {
            $scope.GILmodeAny = !$scope.GILmodeAny;
            SettingsService.set('torrenting.global_include_any', $scope.GILmodeAny);
        };

        $scope.toggleTDsortMenu = function() {
            $scope.allowTDsortMenu = !$scope.allowTDsortMenu;
            SettingsService.set('torrentDialog.sortMenu.enabled', $scope.allowTDsortMenu);
        };

        $scope.toggleTD2 = function() {
            $scope.useTD2 = !$scope.useTD2;
            SettingsService.set('torrentDialog.2.enabled', $scope.useTD2);
            window.location.reload();
        };

        $scope.toggleDirectory = function() {
            $scope.directoryEnabled = !$scope.directoryEnabled;
            SettingsService.set('torrenting.directory', $scope.directoryEnabled);
        };

        $scope.toggleLabel = function() {
            $scope.labelEnabled = !$scope.labelEnabled;
            SettingsService.set('torrenting.label', $scope.labelEnabled);
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
            $scope.adEnabled = !$scope.adEnabled;
            SettingsService.set('torrenting.autodownload', $scope.adEnabled);
            $scope.adEnabled ? AutoDownloadService.attach() : AutoDownloadService.detach();
        };

        $scope.toggleChromium = function() {
            $scope.chromiumEnabled = !$scope.chromiumEnabled;
            SettingsService.set('torrenting.launch_via_chromium', $scope.chromiumEnabled);
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
         * Changes the delay that AutoDownload waits before searching for an episodes' torrent
         */
        $scope.saveADDelay = function(delay) {
            SettingsService.set('autodownload.delay', delay.dhmToMins());
            AutoDownloadService.detach(); // restart kickoff method.
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
            window.location.reload();
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

        /**
         * Save Global Include list
         */
        $scope.saveGlobalInclude = function(list) {
            $scope.globalInclude = list;
            SettingsService.set('torrenting.global_include', $scope.globalInclude);
        };

        /**
         * Save Global Exclude list
         */
        $scope.saveGlobalExclude = function(list) {
            $scope.globalExclude = list;
            SettingsService.set('torrenting.global_exclude', $scope.globalExclude);
        };

        /**
         * Save Global Size Min
         */
        $scope.saveGlobalSizeMin = function(size) {
            $scope.globalSizeMin = size;
            SettingsService.set('torrenting.global_size_min', $scope.globalSizeMin);
        };

        /**
         * Save Global Size Max
         */
        $scope.saveGlobalSizeMax = function(size) {
            $scope.globalSizeMax = size;
            SettingsService.set('torrenting.global_size_max', $scope.globalSizeMax);
        };

    }
])
.directive('adDelayValidation', ["SettingsService", function(SettingsService) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attr, ctrl) {
            function validationError(value) {
                // if empty then exit
                if (null === value || undefined === value || '' === value) {
                    ctrl.$setValidity('addelayinvalid', true);
                    return value;
                }
                // customDelay.max cannot exceed adPeriod (days converted to minutes).
                var adDelayMaxMinutes = parseInt(SettingsService.get('autodownload.period') * 24 * 60); 
                // parse dhm
                var dhmPart = value.split(/[\s:]+/);
                var days = parseInt(dhmPart[0]);
                var hours = parseInt(dhmPart[1]);
                var minutes = parseInt(dhmPart[2]);
                // test validity
                var valid = (days >= 0 && days <= 21 && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && value.dhmToMins() <= adDelayMaxMinutes);
                // set error state
                ctrl.$setValidity('addelayinvalid', valid);
                return value;
            }
            // insert function into parsers list
            ctrl.$parsers.push(validationError);
        }
    }
}])
