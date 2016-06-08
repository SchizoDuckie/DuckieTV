DuckieTV.directive('fastSearch', ["$window", "dialogs", "$rootScope",
    function($window, dialogs) {
        var self = this;

        this.fsquery = '';
        this.isNotKK = true; // flag used to prevent kk sequence from triggering fast-search
        this.fsKKi = 0; // index used in preventing kk sequence from triggering fast-search

        //console.debug("fastsearch initializing");
        var isShowing = false;

        var focusInput = function() {
            var i = document.querySelector(".fastsearch input");
            if (i) {
                i.value = self.fsquery;
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
                key: self.fsquery
            }, {
                size: 'xs'
            });

            setTimeout(focusInput, 50);

            d.result.then(function() {
                //console.debug('Success');
                d = undefined;
                isShowing = false;
                self.fsquery = '';
            }, function() {
                //console.debug('Cancelled');
                d = undefined;
                isShowing = false;
                self.fsquery = '';
            });
        };

        return {
            restrict: 'E',
            link: function() {
                //console.debug("fastsearch initialized");
                $window.addEventListener('keydown', function(e) {
                    // parse key codes, trap kk sequence
                    var kk = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
                    if (e.keyCode === kk[self.fsKKi++]) {
                        // possible kk sequence in progress
                        if (self.fsKKi > 7) {
                            // anticipating final kk sequence
                            self.isNotKK = false;
                        }
                    } else {
                        // not kk sequence
                        self.fsKKi = 0;
                        self.isNotKK = true;
                    }
                });
                $window.addEventListener('keypress', function(e) {
                    // parse char codes for fs query
                    if (!isShowing && e.target.tagName.toLowerCase() == 'input') {
                        // keypress came from a non-fastSearch input element
                        e.stopPropagation();
                    } else if (self.isNotKK) {
                        // keypress did not come from an input element
                        self.fsquery += String.fromCharCode(e.charCode);
                        if (!isShowing && e.target.tagName.toLowerCase() != 'input') {
                            self.createDialog();
                        }
                    }
                });
            }
        }
    }
])

.controller('fastSearchCtrl', ["$scope", "data", "FavoritesService", "TraktTVv2", "$rootScope", "$uibModalInstance", "$state", "SeriesListState", "SidePanelState", "TorrentSearchEngines", "SettingsService", "$injector", "TorrentHashListService",
    function($scope, data, FavoritesService, TraktTVv2, $rootScope, $modalInstance, $state, SeriesListState, SidePanelState, TorrentSearchEngines, SettingsService,  $injector, TorrentHashListService) {

        $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
        $scope.hasFocus = true;
        $scope.model = {
            fsquery: data.key
        };

        $scope.searchResults = {
            series: [],
            traktSeries: [],
            episodes: [],
            torrents: []
        };

        $scope.seriesLoading = true;
        $scope.traktSeriesLoading = true;
        $scope.episodesLoading = true;
        $scope.torrentsLoading = true;

        $scope.fields = [{
            key: "fsquery",
            type: "input",
            modelOptions: {
                "debounce": {
                    'default': 500,
                    'blur': 0
                },
                updateOn: "default blur"
            },
            templateOptions: {
                label: "",
                placeholder: "",
                type: "text",
                onChange: function(e) {
                    $scope.search(e);
                }
            },
            "expressionProperties": {
                "templateOptions.label": "\"FASTSEARCHjs/search-anything/lbl\"|translate",
                "templateOptions.placeholder": "\"FASTSEARCHjs/placeholder\"|translate"
            }
        }];


        $scope.getSerie = function(episode) {
            return FavoritesService.getByID_Serie(episode.ID_Serie);
        };

        $scope.search = function(value) {
            if (!value || value === "") {
                $scope.searchResults = {
                    series: [],
                    traktSeries: [],
                    episodes: [],
                    torrents: []
                };
                return;
            }

            $scope.seriesLoading = true;
            $scope.traktSeriesLoading = true;
            $scope.episodesLoading = true;
            $scope.torrentsLoading = true;

            $scope.searchResults.series = FavoritesService.favorites.filter(function(serie) {
                $scope.seriesLoading = false;
                return serie.name.toLowerCase().indexOf(value.toLowerCase()) > -1;
            });

            /**
             * Word-by-word scoring for search results for trakt.tv.
             * All words need to be in the search result's release name, or the result will be filtered out.
             */
            function traktFilterByScore(item) {
                var score = 0,
                    query = value.toLowerCase().split(' '),
                    name = item.name.toLowerCase();
                query.map(function(part) {
                    if (name.indexOf(part) > -1) {
                        score++;
                    }
                });
                return (score == query.length);
            }
            /**
             * Word-by-word scoring for search results for torrents.
             * All words need to be in the search result's release name, or the result will be filtered out.
             */
            function torrentFilterByScore(item) {
                var score = 0,
                    query = value.toLowerCase().split(' '),
                    name = item.releasename.toLowerCase();
                query.map(function(part) {
                    if (name.indexOf(part) > -1) {
                        score++;
                    }
                });
                return (score == query.length);
            }

            CRUD.Find("Episode", Array("episodename like '%" + value + "%'")).then(function(results) {
                $scope.searchResults.episodes = results;
                $rootScope.$applyAsync();
                $scope.episodesLoading = false;
            });

            TraktTVv2.search(value).then(function(results) {
                $scope.searchResults.traktSeries = results.filter(traktFilterByScore);
                $rootScope.$applyAsync();
                $scope.traktSeriesLoading = false;
            }).catch(function(err) {
                console.error("TraktTV search error!", err);
                $scope.traktSeriesLoading = false;
                $scope.searchResults.traktSeries = [];
            });

            if (SettingsService.get('torrenting.enabled')) {
                TorrentSearchEngines.getSearchEngine($scope.searchprovider).search(value).then(function(results) {
                    $scope.searchResults.torrents = results.filter(torrentFilterByScore);
                    $rootScope.$applyAsync();
                    $scope.torrentsLoading = false;
                },
                function(err) {
                    console.error("Torrent search error!", err);
                    $scope.torrentsLoading = false;
                    $scope.searchResults.torrents = [];
                });
            }
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
                        SidePanelState.hide();
                        $rootScope.$broadcast('storage:update');
                        FavoritesService.added(serie.tvdb_id);
                        $scope.search(self.fsquery);
                    });
                }, function(err) {
                    SidePanelState.hide();
                    console.error("Error adding show!", err);
                    FavoritesService.added(serie.tvdb_id);
                    FavoritesService.addError(serie.tvdb_id, err);
                });
            }
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

        // Selects and launches magnet
        var magnetSelect = function(magnet) {
            console.info("Magnet selected!", magnet);
            $modalInstance.close(magnet);

            TorrentSearchEngines.launchMagnet(magnet, data.key);
            // record that this magnet was launched under DuckieTV's control. Used by auto-Stop.
            TorrentHashListService.addToHashList(magnet.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase());
        };

        var urlSelect = function(url, releasename) {
            console.info("Torrent URL selected!", url);
            $modalInstance.close(url);

            $injector.get('$http').get(url, {
                responseType: 'blob'
            }).then(function(result) {
                try {
                    TorrentSearchEngines.launchTorrentByUpload(result.data, data.key, releasename);
                } catch (E) {
                    TorrentSearchEngines.launchTorrentByURL(url, data.key, releasename);
                }
            });
        };

        $scope.torrentSelect = function(result) {
            var config = TorrentSearchEngines.getSearchEngine($scope.searchprovider).config;
            if (config && 'noMagnet' in config && config.noMagnet) {
                return urlSelect(result.torrentUrl, result.releasename);
            } else {
                return magnetSelect(result.magneturl);
            }
        };

        $scope.search(data.key);
    }
]);