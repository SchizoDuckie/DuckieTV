DuckieTV.controller('localSeriesCtrl', ["$rootScope",
    function($rootScope) {
        var localFilter = this;
        this.isFiltering = true;

        // Broadcast empty filter to reset the value in the SeriesList Ctrl        
        $rootScope.$broadcast('serieslist:filter', '');

        this.setFilter = function(val) {
            $rootScope.$broadcast('serieslist:filter', val);
        };

    }
])