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

    }
]);