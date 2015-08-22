DuckieTV.controller('serieTorrentSettingsCtrl', function($scope, $modalInstance, data) {

    $scope.model = data.serie;
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
        key: "autoDownload",
        type: "checkbox",
        templateOptions: {
            label: "Auto-Download this show",
            class: 'form-control'
        },

    }];

    $scope.save = function() {
        $scope.model.autoDownload = $scope.model.autoDownload ? 1 : 0;
        $scope.model.Persist();
        $modalInstance.dismiss();
    };

    $scope.cancel = function() {
        $modalInstance.dismiss('Canceled');
    };

});