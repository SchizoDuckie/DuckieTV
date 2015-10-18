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

.controller('fastSearchCtrl', ["$scope", "data", "FavoritesService", "TraktTVv2", "$rootScope", "$modalInstance", "$state", "SeriesListState", "SidePanelState",
    function($scope, data, FavoritesService, TraktTVv2, $rootScope, $modalInstance, $state, SeriesListState, SidePanelState) {

        $scope.hasFocus = true;
        $scope.model = {
            query: data.key
        };

        $scope.searchResults = {
            series: [],
            traktSeries: [],
            episodes: []
        };

        $scope.seriesLoading = true;
        $scope.traktSeriesLoading = true;
        $scope.episodesLoading = true;

        $scope.fields = [{
            key: "query",
            type: "input",
            modelOptions: {
                "debounce": {
                    'default': 500,
                    'blur': 0
                },
                updateOn: "default blur"
            },
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
            if (!value || value == "") {
                $scope.searchResults = {
                    series: [],
                    traktSeries: [],
                    episodes: []
                };
                return;
            }
            $scope.seriesLoading = true;
            $scope.traktSeriesLoading = true;
            $scope.episodesLoading = true;

            $scope.searchResults.series = FavoritesService.favorites.filter(function(serie) {
                $scope.seriesLoading = false;
                return serie.name.toLowerCase().indexOf(value.toLowerCase()) > -1;
            });

            CRUD.Find("Episode", Array("episodename like '%" + value + "%'")).then(function(result) {
                $scope.searchResults.episodes = result;
                $rootScope.$applyAsync();
                $scope.episodesLoading = false;
            });

            TraktTVv2.search(value).then(function(results) {
                $scope.searchResults.traktSeries = results;
                $rootScope.$applyAsync();
                $scope.traktSeriesLoading = false;
            });
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };

        /**
         * Add a show to favorites.*The serie object is a Trakt.TV TV Show Object.
         * Queues up the tvdb_id in the serieslist.adding array so that the spinner can be shown.
         * Then adds it to the favorites list and when that 's done, toggles the adding flag to false so that
         * It can show the checkmark.
         */
        $scope.addTraktSerie = function(serie) {
            if (!FavoritesService.isAdding(serie.tvdb_id)) {
                FavoritesService.adding(serie.tvdb_id);
                return TraktTVv2.serie(serie.slug_id).then(function(serie) {
                    return FavoritesService.addFavorite(serie).then(function() {
                        $rootScope.$broadcast('storage:update');
                        FavoritesService.added(serie.tvdb_id);
                        $modalInstance.dismiss('Canceled');
                        $state.go('calendar');
                        SeriesListState.hide();
                    });
                }, function(err) {
                    console.error("Error adding show!", err);
                    FavoritesService.added(serie.tvdb_id);
                    FavoritesService.addError(serie.tvdb_id, err);
                    $state.go('calendar');
                    SeriesListState.hide();
                });
            };
        };

        /**
         * Verify with the favoritesservice if a specific TVDB_ID is registered.
         * Used to show checkmarks in the add modes for series that you already have.
         */
        $scope.isAdded = function(tvdb_id) {
            return FavoritesService.isAdded(tvdb_id);
        };

        /**
         * Returns true as long as the add a show to favorites promise is running.
         */
        $scope.isAdding = function(tvdb_id) {
            return FavoritesService.isAdding(tvdb_id);
        };

        /**
         * Returns true as long as the add a show to favorites promise is running.
         */
        $scope.isError = function(tvdb_id) {
            return FavoritesService.isError(tvdb_id);
        };

        $scope.search(data.key);
    }
]);