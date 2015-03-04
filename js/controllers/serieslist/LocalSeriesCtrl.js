DuckieTV.controller('localSeriesCtrl', ["FavoritesService", "TraktTVv2", "$dialogs", "$location", "$filter", "$scope",
    function(FavoritesService, TraktTVv2, $dialogs, $location, $filter, $scope) {

        var local = this;
        /**
         * When mode == 'filter', these are in effect.
         * Filters the local series list by substring.
         */
        this.filter = {
            localFilterString: ''
        };

        this.localFilter = function(el) {
            return el.name.toLowerCase().indexOf(local.filter.localFilterString.toLowerCase()) > -1;
        };

        this.setFilter = function(val) {
            local.filter.localFilterString = val;
            console.log(val);
        };
        
        /**
         * Automatically launch the first search result when user hits enter in the filter form
         */
        this.execFilter = function() {
            setTimeout(function() {
                console.log('execing quer!');
                document.querySelector('.series serieheader a').click();
            }, 0)
        };


        /**
         * Change location to the series details when clicked from display mode.
         */
        this.go = function(serieID, episode) {
            window.location.href = '#/serie/' + serieID + '/episode/' + episode.TVDB_ID;
        };


        this.refresh = function(serie) {
            $scope.$emit('serie:updating', serie);
        };


        /**
         * Pop up a confirm dialog and remove the serie from favorites when confirmed.
         */
        this.removeFromFavorites = function(serie) {
            var dlg = $dialogs.confirm($filter('translate')('SERIESLISTjs/serie-delete/hdr'),
                $filter('translate')('SERIESLISTjs/serie-delete-question/p1') +
                serie.name +
                $filter('translate')('SERIESLISTjs/serie-delete-question/p2')
            );
            dlg.result.then(function(btn) {
                console.log("Removing serie '" + serie.name + "' from favorites!", serie);
                FavoritesService.remove(serie);
                if (typeof $location != "undefined") {
                    $location.path('/');
                }
            }, function(btn) {
                this.confirmed = $filter('translate')('SERIESLISTjs/serie-delete-confirmed');
            });
        };

    }
])