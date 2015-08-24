DuckieTV.controller('serieTorrentSettingsCtrl', function($scope, $filter, $modalInstance, FavoritesService, data) {
    console.info("Reinitcontroller!");
    $scope.model = FavoritesService.getById(data.serie.TVDB_ID); // refresh the model because it's cached somehow by the $modalInstance. (serialisation probably)
    $scope.model.autoDownload = $scope.model.autoDownload == 1;
    $scope.fields = [{
        key: "customSearchString",
        type: "input",
        templateOptions: {
            label: $filter('translate')('SERIETORRENTSETTINGSCTRLjs/custom-search/lbl'),
            placeholder: $filter('translate')('SERIETORRENTSETTINGSCTRLjs/custom-search/placeholder'),
            type: "text",
        }
    }, {
        className: 'row',
        fieldGroup: [{
            key: 'autoDownload',
            className: 'inline-checkbox',
            type: "input",
            templateOptions: {
                label: $filter('translate')('SERIETORRENTSETTINGSCTRLjs/auto-download/lbl'),
                type: "checkbox"
            }
        }]
    }];



    $scope.save = function() {
        $scope.model.autoDownload = $scope.model.autoDownload ? 1 : 0;
        $scope.model.customSearchString = $scope.model.customSearchString;

        $scope.model.Persist().then(function() {
            $modalInstance.close();
            $scope.$destroy();
        });
    };

    $scope.cancel = function() {
        $modalInstance.close();
        $scope.$destroy();
    };

});