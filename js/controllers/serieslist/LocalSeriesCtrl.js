DuckieTV.controller('localSeriesCtrl', ["$rootScope", "$filter", "FavoritesService",
    function($rootScope, $filter, FavoritesService) {
        var vm = this;

        // Broadcast empty filter to reset the value in the SeriesList Ctrl
        $rootScope.$broadcast('serieslist:filter', '');
        $rootScope.$broadcast('serieslist:genreFilter', '');
        $rootScope.$broadcast('serieslist:statusFilter', '');

        // Tells the filter control what to filter, updates 300ms after input
        vm.setFilter = function(val) {
            $rootScope.$broadcast('serieslist:filter', val);
            $rootScope.$applyAsync();
        };

        var engGenreList = 'action|adventure|animation|anime|biography|children|comedy|crime|disaster|documentary|drama|eastern|family|fan-film|fantasy|film-noir|food|game-show|history|holiday|home-and-garden|horror|indie|mini-series|music|musical|mystery|news|none|reality|road|romance|science-fiction|short|soap|special-interest|sports|sporting-event|superhero|suspense|talk-show|thriller|travel|tv-movie|war|western'.split('|');
        var engStatusList = 'canceled|ended|in production|returning series|planned'.split('|');
        var translatedGenreList = $filter('translate')('GENRELIST').split('|');
        var translatedStatusList = $filter('translate')('STATUSLIST').split('|');

        vm.genreList = {};
        vm.statusList = {};
        vm.selectedGenres = [];
        vm.selectedStatus = [];

        FavoritesService.favorites.map(function(serie) {
            if (serie.status !== '') {
                if (!(serie.status in vm.statusList)) {
                    vm.statusList[serie.status] = 0;
                }
                vm.statusList[serie.status]++;
            }
            serie.genre.split('|').map(function(genre) {
                if (genre.length === 0) {
                    return;
                }
                if (!(genre in vm.genreList)) {
                    vm.genreList[genre] = 0;
                }
                vm.genreList[genre]++;
            }, vm);
        }, vm);

        vm.selectGenre = function(genre) {
            if (vm.selectedGenres.indexOf(genre) === -1) {
                vm.selectedGenres.push(genre);
            } else {
                vm.selectedGenres.splice(vm.selectedGenres.indexOf(genre), 1);
            }
            $rootScope.$broadcast('serieslist:genreFilter', vm.selectedGenres);
        };

        vm.selectStatus = function(status) {
            if (vm.selectedStatus.indexOf(status) === -1) {
                vm.selectedStatus.push(status);
            } else {
                vm.selectedStatus.splice(vm.selectedStatus.indexOf(status), 1);
            }
            $rootScope.$broadcast('serieslist:statusFilter', vm.selectedStatus);
        };

        vm.getCheckedGenre = function(genre) {
            return vm.selectedGenres.indexOf(genre) > -1;
        };

        vm.getCheckedStatus = function(status) {
            return vm.selectedStatus.indexOf(status) > -1;
        };

        /*
         * Takes the English Genre (as fetched from TraktTV) and returns a translation
         */
        vm.translateGenre = function(genre) {
            var idx = engGenreList.indexOf(genre);
            return (idx !== -1) ? translatedGenreList[idx] : genre;
        };

        /*
         * Takes the English status (as fetched from TraktTV) and returns a translation
         */
        vm.translateStatus = function(status) {
            var idx = engStatusList.indexOf(status);
            return (idx !== -1) ? translatedStatusList[idx] : status;
        };
    }
]);