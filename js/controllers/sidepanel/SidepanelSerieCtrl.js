DuckieTV.controller('SidepanelSerieCtrl', function($dialogs, $filter, FavoritesService, $location, serie, latestSeason) {

    this.serie = serie;
    this.latestSeason = latestSeason;

    this.toggleSerieDisplay = function() {
        this.serie.displaycalendar = sidepanel.serie.displaycalendar == '1' ? '0' : '1';
        this.serie.Persist().then(function() {
            $rootScope.$broadcast('favorites:updated');
        });
    };

    /**
     * Pop up a confirm dialog and remove the serie from favorites when confirmed.
     */
    this.removeFromFavorites = function() {
        var dlg = $dialogs.confirm($filter('translate')('SERIESLISTjs/serie-delete/hdr'),
            $filter('translate')('SERIESLISTjs/serie-delete-question/p1') +
            this.serie.name +
            $filter('translate')('SERIESLISTjs/serie-delete-question/p2')
        );
        dlg.result.then(function(btn) {
            console.log("Removing serie '" + serie.name + "' from favorites!", serie);
            FavoritesService.remove(serie);
            $location.path('/');
        }, function(btn) {
            this.confirmed = $filter('translate')('SERIESLISTjs/serie-delete-confirmed');
        });
    };
})