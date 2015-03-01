DuckieTV.controller('traktTvSearchCtrl', ["$scope", "TraktTVv2", "$stateParams",
    function($scope, TraktTVv2, $stateParams) {

        var traktSearch = this;

        this.results = false;
        this.searching = false;
        this.error = false;


        TraktTVv2.search($stateParams.query).then(function(res) {
            traktSearch.error = false;
            traktSearch.searching = TraktTVv2.hasActiveSearchRequest();
            traktSearch.results = res || [];
            $scope.$applyAsync();
        }).catch(function(err) {
            console.error("Search error!", err);
            traktSearch.error = err;
            traktSearch.searching = TraktTVv2.hasActiveSearchRequest();
            traktSearch.results = [];
        });


    }
])