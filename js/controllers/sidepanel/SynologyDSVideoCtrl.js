/**
 * Synology DS-Video main control interface
 * Lists devices and library and control options
 */
DuckieTV.controller('SynologyDSVideoCtrl', ["SynologyAPI", "$scope",

    function(SynologyAPI, $scope) {
        var self = this;

        this.library = null;
        this.devices = null;
        this.folders = null;

        SynologyAPI.Library().then(function(library) {
            self.library = library;
        });

        SynologyAPI.DeviceList().then(function(devices) {
            self.devices = devices;
        })

        SynologyAPI.Folder().then(function(folders) {
            self.folders = folders;
        })

        this.play = function(file) {
            SynologyAPI.PlayFile(file, self.devices[0]);
        }

        this.getFilesForFolder = function(folder) {
            return SynologyAPI.Folder({
                id: folder.id
            }).then(function(result) {
                folder.files = result;
                return folder;
            });
        }
    }
]);