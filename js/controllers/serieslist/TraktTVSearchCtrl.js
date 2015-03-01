DuckieTV.controller('traktTvSearchCtrl', ["$scope", "TraktTVv2",
    function($scope, $rootScope, TraktTVv2) {

        var traktSearch = this;

        this.results = false;
        this.searching = false;
        this.error = false;

        this.search = {
            query: ''
        };

    }
])