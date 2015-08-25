DuckieTV.directive('fastSearch', ["$window", "dialogs",

    function($window, dialogs) {
        console.warn("fastsearch initializing");
        var isShowing = false;

        function createDialog(initialQuery) {
            isShowing = true;
            var d = dialogs.create('templates/fastSearch.html', 'fastSearchCtrl', {
                key: initialQuery
            }, {
                size: 'xs'
            });

            setTimeout(function() {
                document.querySelector(".fastsearch input").focus();
            }, 0);

            d.result.then(function() {
                //console.debug('Success');
                d = undefined;
                isShowing = false;
            }, function() {
                //console.debug('Cancelled');
                d = undefined;
                isShowing = false;
            });
        }

        return {
            restrict: 'E',
            link: function() {
                var self = this;
                this.keys = '';
                console.warn("fastsearch initialized");
                $window.addEventListener('keypress', function(e) {
                    console.log("key pressed: ", e);
                    if (!isShowing && e.target.tagName.toLowerCase() != 'input') {
                        createDialog(String.fromCharCode(e.charCode));
                    }
                });
            }
        };
    }
])

.controller('fastSearchCtrl', ["$scope", "data", "FavoritesService", "TraktTVv2",
    function($scope, data, FavoritesService, TraktTVv2) {

        $scope.hasFocus = true;
        $scope.model = {
            query: data.key
        };

        $scope.searchResults = {
            series: [],
            episodes: [],
            actors: []
        };

        $scope.fields = [{
            key: "query",
            type: "input",
            templateOptions: {
                label: "Search for anything",
                placeholder: "series in your favorites, new series to add, episodes, torrents, actors",
                type: "text",
                onChange: function(e) {
                    $scope.search(e);
                }
            }
        }];

        $scope.search = function(value) {
            $scope.searchResults.series = FavoritesService.favorites.filter(function(serie) {
                return serie.name.toLowerCase().indexOf(value.toLowerCase()) > -1;
            });


        };


    }
]);