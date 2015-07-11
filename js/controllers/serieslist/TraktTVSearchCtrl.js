DuckieTV.controller('traktTvSearchCtrl', ["$rootScope", "TraktTVv2", "$stateParams", "$state",
    function($rootScope, TraktTVv2, $stateParams, $state) {

        var traktSearch = this;

        this.results = [];
        this.searching = true;
        this.error = false;

        this.search = {
            query: ''
        };


        TraktTVv2.search($stateParams.query).then(function(res) {
            traktSearch.search.query = $stateParams.query;
            traktSearch.error = false;
            traktSearch.searching = false;
            traktSearch.results = res || [];
            $rootScope.$applyAsync();
        }).catch(function(err) {
            console.error("Search error!", err);
            traktSearch.error = err;
            traktSearch.searching = false;
            traktSearch.results = [];
        });

        /**
         * When in add mode, ng-hover sets this serie on the scope, so that it can be shown
         * by the seriedetails directive
         * @param {[type]} serie [description]
         */
        this.setHoverSerie = function(serie) {
            //console.log("Hover serie!", serie);
            $state.go('favorites.add.search.trakt-serie', {
                id: serie.slug_id,
                serie: serie
            });
        };
    }
]);