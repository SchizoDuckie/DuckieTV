angular.module('DuckieTV.providers.syncmanager', [])

.factory('SyncManager', function() {

    targets: [],

    registerTarget

    addTask

    isSyncing


    $rootScope.$on('sync:processremoteupdate', function(event, progress) {
        console.log("Process storagesync remote updates!", progress);

        FavoritesService.restore(); // message the favoritesservice something has changed and it needs to refresh.
        //service.checkSyncProgress(progress);
    });

    /** 
     * Forward an event to the storagesync service when it's not already syncing.
     * This make sure that local additions / deletions get stored in the cloud.
     */
    $rootScope.$on('storage:update', function() {
        console.info("Received storage:update, writing new series list to cloud storage!");
        service.synchronize();
    });
})