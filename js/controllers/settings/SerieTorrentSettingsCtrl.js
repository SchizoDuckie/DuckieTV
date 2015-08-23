DuckieTV.controller('serieTorrentSettingsCtrl', function($scope, $modalInstance, FavoritesService, data) {
    console.info("Reinitcontroller!");
    $scope.model = FavoritesService.getById(data.serie.TVDB_ID); // refresh the model because it's cached somehow by the $modalInstance. (serialisation probably)
    $scope.model.autoDownload = $scope.model.autoDownload == 1;
    $scope.fields = [{
        key: "customSearchString",
        type: "input",
        templateOptions: {
            label: "Custom Search String",
            placeholder: "String to append to {serie name} {season/episode} (like your favorite release group)",
            type: "text",
        }
    }, {
        className: 'row',
        fieldGroup: [{
            key: 'autoDownload',
            className: 'inline-checkbox',
            type: "input",
            templateOptions: {
                label: "Auto download this show",
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