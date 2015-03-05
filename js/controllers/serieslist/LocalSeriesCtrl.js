DuckieTV.controller('localSeriesCtrl', ["$rootScope",
    function($rootScope) {
        var localFilter = this;
        this.isFiltering = true;
        this.query = '';

        this.setFilter = function(val) {
            localFilter.query = val;
            $rootScope.$broadcast('serieslist:filter', val);
        };

    }
])