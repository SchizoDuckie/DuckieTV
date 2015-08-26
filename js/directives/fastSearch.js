DuckieTV.directive('fastSearch', ["$window", "dialogs", "$rootScope",

    function($window, dialogs, $rootScope) {
        var self = this;

        this.query = '';
        console.warn("fastsearch initializing");
        var isShowing = false;

        this.focusInput = function() {
            var i = document.querySelector(".fastsearch input");
            if (i) {
                i.value = self.query;
                i.focus();
                var e = document.createEvent("HTMLEvents");
                e.initEvent('onchange', true, true);
                i.dispatchEvent(e);
            } else {
                setTimeout(focusInput, 50);
            }
        };

        this.createDialog = function() {
            isShowing = true;
            var d = dialogs.create('templates/fastSearch.html', 'fastSearchCtrl', {
                key: self.query
            }, {
                size: 'xs'
            });

            setTimeout(focusInput, 50);

            d.result.then(function() {
                //console.debug('Success');
                d = undefined;
                isShowing = false;
                self.query = '';
            }, function() {
                //console.debug('Cancelled');
                d = undefined;
                isShowing = false;
                self.query = '';
            });
        };

        return {
            restrict: 'E',
            link: function() {
                var self = this;
                this.keys = '';
                console.warn("fastsearch initialized");
                $window.addEventListener('keypress', function(e) {
                    self.query += String.fromCharCode(e.charCode);
                    if (!isShowing && e.target.tagName.toLowerCase() != 'input') {
                        self.createDialog();
                    }
                });
            }
        };
    }
])

.controller('fastSearchCtrl', ["$scope", "data", "FavoritesService", "TraktTVv2", "$rootScope",
    function($scope, data, FavoritesService, TraktTVv2, $rootScope) {

        $scope.hasFocus = true;
        $scope.model = {
            query: data.key
        };

        $scope.searchResults = {
            series: [],
            traktSeries: [],
            episodes: [],
            actors: []
        };

        $scope.fields = [{
            key: "query",
            type: "input",
            templateOptions: {
                label: "Search for anything",
                placeholder: "series in your favorites, new series to add, episodes, torrents",
                type: "text",
                onChange: function(e) {
                    $scope.search(e);
                }
            }
        }];


        $scope.getSerie = function(episode) {
            return FavoritesService.getByID_Serie(episode.ID_Serie);
        };

        $scope.search = function(value) {
            $scope.searchResults.series = FavoritesService.favorites.filter(function(serie) {
                return serie.name.toLowerCase().indexOf(value.toLowerCase()) > -1;
            });

            CRUD.Find("Episode", Array("episodename like '%" + value + "%'")).then(function(result) {
                $scope.searchResults.episodes = result;
                $rootScope.$applyAsync();
            });

            TraktTVv2.search(value).then(function(results) {
                $scope.searchResults.traktSeries = results;
                $rootScope.$applyAsync();
            });

        };

        $scope.search(data.key);



    }
]);