DuckieTV.controller('serieTorrentSettingsCtrl', function($scope, $modalInstance, data) {

    $scope.model = data.serie;

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
            label: "Auto-Download this show"
        },

    }];

    $scope.cancel = function() {
        $modalInstance.dismiss('Canceled');
    };

});