/**
 * Displays status of Auto-Download activities
 */
DuckieTV.controller('AutodlstatusCtrl', ["$scope", "$filter", "$injector", "SettingsService", "AutoDownloadService", "TorrentSearchEngines", "DuckieTorrent",
    function($scope, $filter, $injector, SettingsService, AutoDownloadService, TorrentSearchEngines, DuckieTorrent) {

        /**
         * Closes the SidePanel 
         */
        $scope.closeSidePanel = function() {
            $injector.get('$state').go('calendar');
        }

        // If we load onto the page highlight the button
        document.querySelector('#actionbar_autodlstatus').classList.add('active');

        // set up static translated labels
        $scope.period = SettingsService.get('autodownload.period');
        var timePlurals = $filter('translate')('TIMEPLURALS').split('|'), //" day, | days, | hour and | hours and | minute | minutes "
            statusCodes = $filter('translate')('STATUSCODES').split('|'), // "downloaded|watched|has magnet|autoDL disabled|nothing found|filtered out|magnet launched|seeders |onair + delay"
            inactiveLbl = $filter('translate')('AUTODLSTATUSCTRLjs/inactive/lbl'), // inactive
            activeLbl = $filter('translate')('AUTODLSTATUSCTRLjs/active/lbl'), // active
            usingLbl = $filter('translate')('AUTODLSTATUSCTRLjs/using/lbl'), // using
            notusingLbl = $filter('translate')('AUTODLSTATUSCTRLjs/not-using/lbl'), // not using
            csmLbl = $filter('translate')('COMMON/custom-search-size-min-max/lbl'), // Custom Search Size Min/Max
            cssLbl = $filter('translate')('COMMON/custom-search-string/lbl'), // Custom Search String
            gqLbl = $filter('translate')('COMMON/global-quality/hdr'), // Global Quality
            giLbl = $filter('translate')('COMMON/require-keywords/hdr'), // Global Includes List
            geLbl = $filter('translate')('COMMON/ignore-keywords/hdr'), // Global Excludes List
            dayLbl = ($scope.period === 1) ? timePlurals[0].replace(',', '') : timePlurals[1].replace(',', '');
        $scope.onMagnet = [];

        $scope.isActive = function() {
            return $scope.status == activeLbl;
        };

        var getActivity = function() {
            $scope.activityList = AutoDownloadService.activityList;
            $scope.lastRun = SettingsService.get('autodownload.lastrun');
            if ($scope.isActive()) {
                $scope.nextRun = $scope.lastRun + (1000 * 60 * 15);
                $scope.fromDT = AutoDownloadService.fromDT;
                $scope.toDT = AutoDownloadService.toDT;
                /**
                 * This watches for the magnet:select event that will be fired by the
                 * TorrentSearchEngines when a user selects a magnet link for an episode from the autoDLstatus side panel.
                 */
                angular.forEach($scope.activityList, function(activity) {
                    if (activity.status > 2) { // only interested in not-found, filtered-out, seeders-min, no-magnet
                        var tvdbid = activity.episode.TVDB_ID;
                        var episodeid = activity.episode.ID_Episode;
                        if ($scope.onMagnet.indexOf(tvdbid) == -1) { // don't set $on if we've already done it
                            CRUD.FindOne('Episode', {
                                'ID_Episode': episodeid
                            }).then(function(episode) {
                                if (!episode) {
                                    console.warn('episode id=[%s] not found!', episodeid);
                                } else {
                                    $scope.$on('magnet:select:' + tvdbid, function(evt, magnet) {
                                        episode.magnetHash = magnet;
                                        episode.downloaded = 0;
                                        episode.Persist();
                                    });
                                    $scope.onMagnet.push(tvdbid);
                                }
                            });
                        }
                    }
                })
            } else {
                $scope.nextRun = 'n/a';
                $scope.fromDT = 'n/a';
                $scope.toDT = 'n/a';
            };
        };

        // set up static scope data
        $scope.status = (AutoDownloadService.checkTimeout == null) ? inactiveLbl : activeLbl;
        $scope.requireKeywords = SettingsService.get('torrenting.global_include');
        $scope.excludeKeywords = SettingsService.get('torrenting.global_exclude');
        $scope.globalQuality = (SettingsService.get('torrenting.searchquality') == '') ? 'All' : SettingsService.get('torrenting.searchquality');
        $scope.searchEngine = SettingsService.get('torrenting.searchprovider');
        $scope.globalSizeMax = SettingsService.get('torrenting.global_size_max');
        $scope.globalSizeMin = SettingsService.get('torrenting.global_size_min');
        $scope.period = $scope.period + ' ' + dayLbl;
        $scope.minSeeders = SettingsService.get('autodownload.minSeeders');
        $scope.sortBy = ['-status', 'search'];
        getActivity();

        // set up dynamic scope data
        $scope.$on('autodownload:activity', function(event) {
            var status = (DuckieTorrent.getClient().isConnected()) ? activeLbl : inactiveLbl;
            $scope.status = (DuckieTorrent.getClient().isConnecting) ? activeLbl : status;
            getActivity();
        });

        $scope.getTooltip = function(option, item) {
            switch (option) {
                case 'csm':
                    return (item.csm == 0) ? notusingLbl + ' ' + csmLbl : usingLbl + ' ' + csmLbl + ' (' + (item.serie.customSearchSizeMin == null ? '-' : item.serie.customSearchSizeMin) + '/' + (item.serie.customSearchSizeMax == null ? '-' : item.serie.customSearchSizeMax) + ')';
                case 'css':
                    return (item.css == 0) ? notusingLbl + ' ' + cssLbl : usingLbl + ' ' + cssLbl + ' (' + item.serie.customSearchString + ')';
                case 'igq':
                    return (item.igq == 0) ? usingLbl + ' ' + gqLbl : notusingLbl + ' ' + gqLbl;
                case 'igi':
                    return (item.igi == 0) ? usingLbl + ' ' + giLbl : notusingLbl + ' ' + giLbl;
                case 'ige':
                    return (item.ige == 0) ? usingLbl + ' ' + geLbl : notusingLbl + ' ' + geLbl;
            };
        };

        $scope.getTorrentClientNameAndStatus = function() {
            var status = (DuckieTorrent.getClient().isConnected()) ? $filter('translate')('COMMON/tc-connected/lbl') : $filter('translate')('COMMON/tc-offline/lbl');
            status = (DuckieTorrent.getClient().isConnecting) ? $filter('translate')('COMMON/tc-connecting/lbl') : status;
            return $filter('translate')('AUTODLSTATUSCTRLjs/no-activity/lbl') + DuckieTorrent.getClient().getName().split(' ')[0].toLowerCase() + ' ' + status;
        };

        $scope.getStatusCode = function(code, extra) {
            extra = typeof(extra) == 'undefined' ? '' : extra;
            if (statusCodes.length - 1 >= code) {
                return statusCodes[code] + extra;
            } else {
                return 'n/a ' + extra;
            };
        };

    }
]);