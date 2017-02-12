DuckieTV.directive('seriesList', ["SeriesListState", "SeriesAddingState", function(SeriesListState, SeriesAddingState) {
    return {
        restrict: 'E',
        controllerAs: 'serieslist',
        controller: function() {
            this.seriesListState = SeriesListState.state;
            this.seriesAddingState = SeriesAddingState.state;
        }
    };
}]);