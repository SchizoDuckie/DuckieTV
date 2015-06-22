DuckieTV.controller('localSeriesCtrl', ["$rootScope", "$filter", "FavoritesService",
    function($rootScope, $filter, FavoritesService) {
        var vm = this;

        // Broadcast empty filter to reset the value in the SeriesList Ctrl        
        $rootScope.$broadcast('serieslist:filter', '');
        $rootScope.$broadcast('serieslist:genres', '');
        $rootScope.$broadcast('serieslist:selectedstatus', '');

        this.setFilter = function(val) {
            $rootScope.$broadcast('serieslist:filter', val);
        };

        var engGenreList = 'action|adventure|animation|children|comedy|crime|disaster|documentary|drama|eastern|family|fan-film|fantasy|film-noir|food|game-show|history|holiday|home-and-garden|horror|indie|mini-series|music|musical|mystery|news|none|reality|road|romance|science-fiction|short|soap|special-interest|sport|suspense|talk-show|thriller|travel|tv-movie|war|western'.split('|');
        var engStatusList = 'canceled|ended|in production|returning series'.split('|');
        var translatedGenreList = $filter('translate')('GENRELIST').split(',');
        var translatedStatusList = $filter('translate')('STATUSLIST').split(',');

        this.genreList = {};
        this.statusList = {};
        this.selectedGenres = [];
        this.selectedStatus = [];

        FavoritesService.favorites.map(function(serie) {
            if (serie.status !== '') {
                if (!(serie.status in this.statusList)) {
                    this.statusList[serie.status] = 0;
                }
                this.statusList[serie.status]++;
            }
            serie.genre.split('|').map(function(genre) {
                if (genre.length === 0) {
                    return;
                }
                if (!(genre in this.genreList)) {
                    this.genreList[genre] = 0;
                }
                this.genreList[genre]++;
            }, this);
        }, this);

        this.selectGenre = function(genre) {
            if (this.selectedGenres.indexOf(genre) == -1) {
                this.selectedGenres.push(genre);
            } else {
                this.selectedGenres.splice(this.selectedGenres.indexOf(genre), 1);
            }
            $rootScope.$broadcast('serieslist:genres', this.selectedGenres);
        };

        this.selectStatus = function(status) {
            if (this.selectedStatus.indexOf(status) == -1) {
                this.selectedStatus.push(status);
            } else {
                this.selectedStatus.splice(this.selectedStatus.indexOf(status), 1);
            }
        $rootScope.$broadcast('serieslist:selectedstatus', this.selectedStatus);
        };

        this.getCheckedGenre = function(genre) {
            return this.selectedGenres.indexOf(genre) > -1;
        };

        this.getCheckedStatus = function(status) {
            return this.selectedStatus.indexOf(status) > -1;
        };

        /*
         * Takes the English Genre (as fetched from TraktTV) and returns a translation
         */
        this.translateGenre = function(genre) {
            var idx = engGenreList.indexOf(genre);
            return (idx != -1) ? translatedGenreList[idx] : genre;
        };

        /*
         * Takes the English status (as fetched from TraktTV) and returns a translation
         */
        this.translateStatus = function(status) {
            var idx = engStatusList.indexOf(status);
            return (idx != -1) ? translatedStatusList[idx] : status;
        };

    }
]);