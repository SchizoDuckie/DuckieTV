DuckieTV
.controller('serieSettingsCtrl', ["$scope", "$filter", "$uibModalInstance", "FavoritesService", "FormlyLoader", "data", "TorrentSearchEngines", "DuckieTorrent",
function($scope, $filter, $modalInstance, FavoritesService, FormlyLoader, data, TorrentSearchEngines, DuckieTorrent) {
    $scope.model = FavoritesService.getById(data.serie.TVDB_ID); // refresh the model because it's cached somehow by the $modalInstance. (serialisation probably)
    $scope.model.ignoreHideSpecials = $scope.model.ignoreHideSpecials == 1;
    $scope.model.autoDownload = $scope.model.autoDownload == 1;
    $scope.model.ignoreGlobalQuality = $scope.model.ignoreGlobalQuality == 1;
    $scope.model.ignoreGlobalIncludes = $scope.model.ignoreGlobalIncludes == 1;
    $scope.model.ignoreGlobalExcludes = $scope.model.ignoreGlobalExcludes == 1;

    // determine if client is local or remote (not fool proof, is there a better way?)
    if (DuckieTorrent.getClient().getName() === 'uTorrent') {
        var server = ''; // uTorrent does not have a config.server
    } else {
        var server = DuckieTorrent.getClient().config.server;
    }
    var isLocal = (server === 'http://127.0.0.1' || server === 'http://localhost');
    // determine if this is standalone
    var isStandalone = (navigator.userAgent.toLowerCase().indexOf('standalone') !== -1);
    // determine if downloadPath is supported by client
    var isDownloadPathSupported = DuckieTorrent.getClient().isDownloadPathSupported();
    $scope.model.dlPathLocal = $scope.model.dlPath;
    $scope.model.dlPathRemote = $scope.model.dlPath;

    FormlyLoader.load('SerieSettings').then(function(form) {
        $scope.fields = form;
        // don't understand why this is here, other than the fact that if it is not then the hideExpressions don't work :-( 
        $scope.model.isDownloadPathSupportedLocal = (isDownloadPathSupported && isStandalone && isLocal);
        $scope.model.isDownloadPathSupportedRemote = (isDownloadPathSupported && ((!isStandalone) || (isStandalone && !isLocal)));
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