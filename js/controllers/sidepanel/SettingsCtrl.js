/**
 * Setting controller for the settings pages
 *
 * Contains various controllers for different settings tabs
 */



/** 
 * Root controller for settings pages
 */
DuckieTV.controller('SettingsCtrl', ["FavoritesService",

    function(FavoritesService) {
        $scope.favorites = FavoritesService.favorites;
    }
]);