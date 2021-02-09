DuckieTV.factory('SyncManager', function() {
  $rootScope.$on('storage:update', function() {
    console.info('Received storage:update, writing new series list to cloud storage!')
    service.synchronize()
  })
})
