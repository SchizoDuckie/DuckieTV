DuckieTV
.controller('serieSettingsCtrl', ["$scope", "$filter", "$uibModalInstance", "FavoritesService", "FormlyLoader", "data", "TorrentSearchEngines", "DuckieTorrent",
function($scope, $filter, $modalInstance, FavoritesService, FormlyLoader, data, TorrentSearchEngines, DuckieTorrent) {
    $scope.model = FavoritesService.getById(data.serie.TVDB_ID); // refresh the model because it's cached somehow by the $modalInstance. (serialisation probably)
    $scope.model.ignoreHideSpecials = $scope.model.ignoreHideSpecials == 1;
    $scope.model.autoDownload = $scope.model.autoDownload == 1;
    $scope.model.ignoreGlobalQuality = $scope.model.ignoreGlobalQuality == 1;
    $scope.model.ignoreGlobalIncludes = $scope.model.ignoreGlobalIncludes == 1;
    $scope.model.ignoreGlobalExcludes = $scope.model.ignoreGlobalExcludes == 1;
    if ((navigator.userAgent.toLowerCase().indexOf('standalone') !== -1)) {
        var serieSettingsName = 'SerieSettingsStandalone';
    } else {
        var serieSettingsName = 'SerieSettings';
    }

    FormlyLoader.load(serieSettingsName).then(function(form) {
        $scope.fields = form;
        $scope.model.isDownloadPathSupported = DuckieTorrent.getClient().isDownloadPathSupported();
    });

    $scope.searchProviders = [{'name': '', 'value': null}];
    Object.keys(TorrentSearchEngines.getSearchEngines()).map(function(searchProvider) {
        $scope.searchProviders.push({'name': searchProvider, 'value': searchProvider});
    });

    FormlyLoader.setMapping('options', {
        'searchProviders': $scope.searchProviders
    });

    $scope.save = function() {
        $scope.model.ignoreHideSpecials = $scope.model.ignoreHideSpecials ? 1 : 0;
        $scope.model.autoDownload = $scope.model.autoDownload ? 1 : 0;
        $scope.model.ignoreGlobalQuality = $scope.model.ignoreGlobalQuality ? 1 : 0;
        $scope.model.ignoreGlobalIncludes = $scope.model.ignoreGlobalIncludes ? 1 : 0;
        $scope.model.ignoreGlobalExcludes = $scope.model.ignoreGlobalExcludes ? 1 : 0;
        // despite (because?) type=number, some invalid data trapped by formly returns undefined. so this ensures that we persist as null to stop downstream errors.
        $scope.model.customSearchSizeMin = (typeof $scope.model.customSearchSizeMin === 'undefined') ? null : $scope.model.customSearchSizeMin;
        $scope.model.customSearchSizeMax = (typeof $scope.model.customSearchSizeMax === 'undefined') ? null : $scope.model.customSearchSizeMax;
        $scope.model.dlPath = (typeof $scope.model.dlPath === 'undefined' || $scope.model.dlPath === '') ? null : $scope.model.dlPath;

        $scope.model.Persist().then(function() {
            $modalInstance.close();
            $scope.$destroy();
        });
    };

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