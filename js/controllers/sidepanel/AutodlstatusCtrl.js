/**
 *Displays status of Auto-Download activities
 */
DuckieTV.controller('AutodlstatusCtrl', ["$scope", "$filter", "SettingsService", "AutoDownloadService", "TorrentSearchEngines", "DuckieTorrent",
    function($scope, $filter, SettingsService, AutoDownloadService, TorrentSearchEngines, DuckieTorrent) {

        // If we load onto the page highlight the button
        document.querySelector('#actionbar_autodlstatus').classList.add('active');

        var timePlurals = $filter('translate')('TIMEPLURALS').split('|'); //" day, | days, | hour and | hours and | minute | minutes "
        $scope.activityList = AutoDownloadService.activityList;
        $scope.status = (AutoDownloadService.checkTimeout == null) ? 'inactive' : 'active';
        $scope.lastRun = SettingsService.get('autodownload.lastrun');
        $scope.globalInclude = SettingsService.get('torrenting.global_include');
        $scope.globalExclude = SettingsService.get('torrenting.global_exclude');
        $scope.globalQuality = (SettingsService.get('torrenting.searchquality') == '') ? 'All' : SettingsService.get('torrenting.searchquality');
        $scope.searchEngine = SettingsService.get('torrenting.searchprovider');
        $scope.period = SettingsService.get('autodownload.period');
        var dayLbl = ($scope.period === 1) ? timePlurals[0].replace(',','') : timePlurals[1].replace(',','');
        $scope.period = $scope.period + ' ' + dayLbl;
        $scope.minSeeders = SettingsService.get('autodownload.minSeeders');
        if ($scope.status == 'active') {
            $scope.nextRun = $scope.lastRun + (1000 * 60 * 15);
            $scope.fromDT = AutoDownloadService.fromDT;
            $scope.toDT = AutoDownloadService.toDT;
        } else {
            $scope.nextRun = 'n/a';
            $scope.fromDT = 'n/a';
            $scope.toDT = 'n/a';
        };

        $scope.$on('autodownload:activity', function(event) {
            $scope.activityList = AutoDownloadService.activityList;
            $scope.lastRun = SettingsService.get('autodownload.lastrun');
            var status = (DuckieTorrent.getClient().isConnected()) ? 'active' : 'inactive';
            status = (DuckieTorrent.getClient().isConnecting) ? 'inactive' : status;
            $scope.status = status;
            if ($scope.status == 'active') {
                $scope.nextRun = $scope.lastRun + (1000 * 60 * 15);
                $scope.fromDT = AutoDownloadService.fromDT;
                $scope.toDT = AutoDownloadService.toDT;
            } else {
                $scope.nextRun = 'n/a';
                $scope.fromDT = 'n/a';
                $scope.toDT = 'n/a';
            };
        });
        
        $scope.getTooltip = function(item, state) {
            switch (item) {
                case 'css': return (state == 0) ? 'not using Custom Search String' :  'using Custom Search String';
                case 'igq': return (state == 0) ? 'using Global Quality' : 'not using Global Quality';                    
                case 'igi': return (state == 0) ? 'using Global Includes' : 'not using Global Includes';                    
                case 'ige': return (state == 0) ?  'using Global Excludes' :  'not using Global Excludes';                    
            };
        };

        $scope.getTorrentClientNameAndStatus = function() {
            var status = (DuckieTorrent.getClient().isConnected()) ? ' is connected' : ' is offline';
            status = (DuckieTorrent.getClient().isConnecting) ? 'is connecting' : status;
            return DuckieTorrent.getClient().getName().split(' ')[0].toLowerCase() + status;
        };
    }
]);
