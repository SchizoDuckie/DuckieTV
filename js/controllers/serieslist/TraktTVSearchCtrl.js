DuckieTV.controller('traktTvSearchCtrl', ["$rootScope", "TraktTVv2", "$stateParams", function($rootScope, TraktTVv2, $stateParams) {
        var vm = this;

        vm.results = [];
        vm.searching = true;
        vm.error = false;
        vm.search = {
            query: ''
        };

        TraktTVv2.search($stateParams.query).then(function(res) {
            vm.search.query = $stateParams.query;
            vm.error = false;
            vm.searching = false;
            vm.results = res || [];
            $rootScope.$applyAsync();
        }).catch(function(err) {
            console.error("Search error!", err);
            vm.error = err;
            vm.searching = false;
            vm.results = [];
        });
    }
]);