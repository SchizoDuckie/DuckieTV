DuckieTV
.controller('serieSettingsCtrl', ["$scope", "$filter", "$uibModalInstance", "FavoritesService", "SettingsService", "FormlyLoader", "data", "TorrentSearchEngines", "DuckieTorrent", "SceneXemResolver",
function($scope, $filter, $modalInstance, FavoritesService, SettingsService, FormlyLoader, data, TorrentSearchEngines, DuckieTorrent, SceneXemResolver) {

    // customDelay.max cannot exceed adPeriod (days converted to minutes).
    var adDelayMaxMinutes = parseInt(SettingsService.get('autodownload.period') * 24 * 60); 

    /**
     * set up form field contents
     */
    FormlyLoader.load('SerieSettings').then(function(form) {
        $scope.model = FavoritesService.getById(data.serie.TVDB_ID); // refresh the model because it's cached somehow by the $modalInstance. (serialisation probably)
        $scope.model.ignoreHideSpecials = $scope.model.ignoreHideSpecials == 1;
        $scope.model.autoDownload = $scope.model.autoDownload == 1;
        $scope.model.ignoreGlobalQuality = $scope.model.ignoreGlobalQuality == 1;
        $scope.model.ignoreGlobalIncludes = $scope.model.ignoreGlobalIncludes == 1;
        $scope.model.ignoreGlobalExcludes = $scope.model.ignoreGlobalExcludes == 1;
        $scope.model.hasXemAlias = (SceneXemResolver.getXemAliasListForSerie(data.serie).length > 0);

        // determine if client is local or remote (not fool proof, is there a better way?)
        if (DuckieTorrent.getClient().getName() === 'uTorrent') {
            var server = 'http://localhost'; // uTorrent does not have a config.server
        } else {
            var server = DuckieTorrent.getClient().config.server;
        }
        var isLocal = (server === 'http://127.0.0.1' || server === 'http://localhost');
        // determine if this is standalone
        var isStandalone = (SettingsService.isStandalone());
        // determine if downloadPath is supported by client
        var isDownloadPathSupported = DuckieTorrent.getClient().isDownloadPathSupported();
        $scope.model.dlPathLocal = $scope.model.dlPath;
        $scope.model.dlPathRemote = $scope.model.dlPath;

        $scope.model.isDownloadPathSupportedLocal = (isDownloadPathSupported && isStandalone && isLocal);
        $scope.model.isDownloadPathSupportedRemote = (isDownloadPathSupported && ((!isStandalone) || (isStandalone && !isLocal)));
        
        // note: we are not using $scope.model.customDelay directly as input, to prevent downstream issues with dialogue save and cancel
        $scope.model.customDelayInput = (null === $scope.model.customDelay) ? null : $scope.model.customDelay.minsToDhm();
        
        $scope.fields = form;
    });

    /**
     * set up select list for search providers
     */
    $scope.searchProviders = [{'name': '', 'value': null}];
    Object.keys(TorrentSearchEngines.getSearchEngines()).map(function(searchProvider) {
        $scope.searchProviders.push({'name': searchProvider, 'value': searchProvider});
    });
    /**
     * set up select list for xem alias
     */
    $scope.searchAlias = [{'name': '', 'value': null}];
    SceneXemResolver.getXemAliasListForSerie(data.serie).map(function(alias) {
        $scope.searchAlias.push({'name': alias, 'value': alias});
    });
    FormlyLoader.setMapping('options', {
        'searchProviders': $scope.searchProviders,
        'searchAlias': $scope.searchAlias
    });

    /**
     * set up delay error message interpolation
     */
    FormlyLoader.setMapping('data', {
        'delayErrorMessage': '"' + $filter('translate')('COMMON/autodownload-delay-range/alert', {addelaymax: adDelayMaxMinutes.minsToDhm()}) + '"'
    });

    /**
     * set up days, hours and minutes validation
     */
    FormlyLoader.setMapping('validators', {
        'customDelayInput': {
            'expression': function(viewValue, modelValue, scope) {
                var value = modelValue || viewValue;
                // if empty then exit
                if (null === value || undefined === value || '' === value) {
                    return true;
                }
                // parse dhm
                var dhmPart = value.split(/[\s:]+/);
                var days = parseInt(dhmPart[0]);
                var hours = parseInt(dhmPart[1]);
                var minutes = parseInt(dhmPart[2]);
                // test validity and set error state
                return (days >= 0 && days <= 21 && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && value.dhmToMins() <= adDelayMaxMinutes);
            }
        }
    });

    /**
     * save and persist model
     */
    $scope.save = function() {
        $scope.model.ignoreHideSpecials = $scope.model.ignoreHideSpecials ? 1 : 0;
        $scope.model.autoDownload = $scope.model.autoDownload ? 1 : 0;
        $scope.model.ignoreGlobalQuality = $scope.model.ignoreGlobalQuality ? 1 : 0;
        $scope.model.ignoreGlobalIncludes = $scope.model.ignoreGlobalIncludes ? 1 : 0;
        $scope.model.ignoreGlobalExcludes = $scope.model.ignoreGlobalExcludes ? 1 : 0;
        // despite (because?) type=number, some invalid data trapped by formly returns undefined. so this ensures that we persist as null to stop downstream errors.
        $scope.model.customSearchSizeMin = (typeof $scope.model.customSearchSizeMin === 'undefined') ? null : $scope.model.customSearchSizeMin;
        $scope.model.customSearchSizeMax = (typeof $scope.model.customSearchSizeMax === 'undefined') ? null : $scope.model.customSearchSizeMax;
        $scope.model.customDelay = (typeof $scope.model.customDelayInput === 'undefined'  || $scope.model.customDelayInput === null || $scope.model.customDelayInput === '') ? null : $scope.model.customDelayInput.dhmToMins();
        if ($scope.model.isDownloadPathSupportedLocal) {
            // save model dlPath from content of model dlPathLocal
            $scope.model.dlPath = (typeof $scope.model.dlPathLocal === 'undefined' || $scope.model.dlPathLocal === '') ? null : $scope.model.dlPathLocal;
        }
        if ($scope.model.isDownloadPathSupportedRemote) {
            // save model dlPath from content of model dlPathRemote
            $scope.model.dlPath = (typeof $scope.model.dlPathRemote === 'undefined' || $scope.model.dlPathRemote === '') ? null : $scope.model.dlPathRemote;
        }

        $scope.model.Persist().then(function() {
            $modalInstance.close();
            $scope.$destroy();
        });
    };

    /**
     * get out of dodge
     */
    $scope.cancel = function() {
        $modalInstance.close();
        $scope.$destroy();
    };

}])
.directive("downloadpath", [function () {
    return {
        scope: {
            downloadpath: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                scope.$apply(function () {
                    scope.downloadpath = changeEvent.target.files[0].path;
                });
            });
        }
    }
}]);