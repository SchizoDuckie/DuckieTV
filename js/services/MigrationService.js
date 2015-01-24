angular.module('DuckieTV.providers.migrations', ['ui.bootstrap.modal'])
    .factory('MigrationService', function($modal) {

        var service = {

            check: function() {

                if (!localStorage.getItem('0.9migration')) {
                    CRUD.EntityManager.getAdapter().db.execute('drop table if exists EventSchedule');
                    //localStorage.setItem('0.9migration', true);
                    $modal.open({
                        templateUrl: 'templates/upgrade.html',
                        windowClass: 'dialogs-default',
                        size: 'lg',
                    });
                }
            }
        };

        service.check();
        return service;

    });