DuckieTV

.controller('torrentDialogCtrl', ["$scope", "$rootScope", "$uibModalInstance", "$injector", "$filter", "data", "TorrentSearchEngines", "SettingsService", "TorrentHashListService",
    function($scope, $rootScope, $modalInstance, $injector, $filter, data, TorrentSearchEngines, SettingsService, TorrentHashListService) {
        //-- Variables --//

        $scope.items = [];
        $scope.searching = true;
        $scope.error = false;
        $scope.query = angular.copy(data.query);
        $scope.TVDB_ID = angular.copy(data.TVDB_ID);
        $scope.serie = angular.copy(data.serie);
        $scope.episode = angular.copy(data.episode);
        $scope.allowTDsortMenu = SettingsService.get('torrentDialog.sortMenu.enabled');
        $scope.orderBy = 'seeders';
        $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
        $scope.searchquality = SettingsService.get('torrenting.searchquality');
        if ('serie' in data && $scope.serie.ignoreGlobalQuality != 0) {
            $scope.searchquality = ''; // override quality when the series has the IgnoreQuality flag enabled.
        };
        $scope.globalInclude = SettingsService.get('torrenting.global_include');
        $scope.globalIncludeAny = SettingsService.get('torrenting.global_include_any'); // set the GIL mode (Any or All)
        $scope.globalIncludeEnabled = SettingsService.get('torrenting.global_include_enabled'); // only applies to torrentDialog
        if ('serie' in data && $scope.serie.ignoreGlobalIncludes != 0) {
            $scope.globalIncludeEnabled = false; // override include-list when the series has the IgnoreIncludeList flag enabled.
        };
        $scope.globalExclude = SettingsService.get('torrenting.global_exclude');
        $scope.globalExcludeEnabled = SettingsService.get('torrenting.global_exclude_enabled'); // only applies to torrentDialog
        if ('serie' in data && $scope.serie.ignoreGlobalExcludes != 0) {
            $scope.globalExcludeEnabled = false; // override exclude-list when the series has the IgnoreExcludeList flag enabled.
        };
        $scope.globalSizeMax = SettingsService.get('torrenting.global_size_max'); // torrents larger than this are filtered out
        $scope.globalSizeMaxEnabled = SettingsService.get('torrenting.global_size_max_enabled'); // only applies to torrentDialog
        $scope.globalSizeMin = SettingsService.get('torrenting.global_size_min'); // torrents smaller than this are filtered out
        $scope.globalSizeMinEnabled = SettingsService.get('torrenting.global_size_min_enabled'); // only applies to torrentDialog
        $scope.clients = Object.keys(TorrentSearchEngines.getSearchEngines());
        var provider = TorrentSearchEngines.getSearchEngine($scope.searchprovider);
        if ('serie' in data && $scope.serie.searchProvider != null) {
            provider = TorrentSearchEngines.getSearchEngine($scope.serie.searchProvider); // override searchProvider when the series has one defined.
            $scope.searchprovider = $scope.serie.searchProvider;
        };
        if ('config' in provider && 'orderby' in provider.config) {
            $scope.orderByList = Object.keys(provider.config.orderby);
        } else {
            $scope.orderByList = [];
        }
        $scope.engOrderByList = 'age|leechers|seeders|size'.split('|');
        $scope.translatedOrderByList = $filter('translate')('TDORDERBYLIST').split(',');        

        $scope.getName = function(provider) {
            return provider;
        };

        $scope.search = function(q, TVDB_ID, orderBy) {
            $scope.searching = true;
            $scope.error = false;
            $scope.query = q;
            if (TVDB_ID !== undefined) {
                $scope.TVDB_ID = TVDB_ID;
            };
            if (typeof orderBy !== 'undefined') {
                $scope.orderBy = orderBy;
            };
            // If query is empty, prompt user to enter something
            if (q === null || q === "" || q === undefined) {
                console.warn("Query is empty!");
                $scope.searching = false;
                $scope.error = 'null';
                $scope.items = null;
                return;
            };

            /**
             * Word-by-word scoring for search results.
             * All words need to be in the search result's release name, or the result will be filtered out.
             */
            function filterByScore(item) {
                var score = 0;
                var GIL_String = $scope.globalIncludeEnabled ? $scope.globalIncludeAny ? '' : $scope.globalInclude : ''; // if GIL mode is ALL then add GIL to q
                var query = [q, $scope.searchquality, GIL_String].join(' ').toLowerCase().split(' ');
                name = item.releasename.toLowerCase();
                query.map(function(part) {
                    if (name.indexOf(part) > -1) {
                        score++;
                    }
                });
                return (score == query.length);
            }

            /**
             * Any words in the global include list causes the result to be filtered in.
             */
            function filterGlobalInclude(item) {
                if (!$scope.globalIncludeEnabled || $scope.globalInclude == '') {
                    return true;
                };
                var score = 0;
                var query = $scope.globalInclude.toLowerCase().split(' ');
                name = item.releasename.toLowerCase();
                query.map(function(part) {
                    if (name.indexOf(part) > -1) {
                        score++;
                    }
                });
                return (score > 0);
            };

            /**
             * Any words in the global exclude list causes the result to be filtered out.
             */
            function filterGlobalExclude(item) {
                if (!$scope.globalExcludeEnabled || $scope.globalExclude == '') {
                    return true;
                };
                var score = 0;
                var query = $scope.globalExclude.toLowerCase().split(' ');
                // prevent the exclude list from overriding the primary search string
                query = query.filter(function(el) {
                    return q.indexOf(el) == -1;
                });
                name = item.releasename.toLowerCase();
                query.map(function(part) {
                    if (name.indexOf(part) > -1) {
                        score++;
                    }
                });
                return (score == 0);
            };

            /**
             * Torrent sizes outside min-max range causes the result to be filtered out.
             */
            function filterBySize(item) {
                if (item.size == null || item.size == 'n/a') {
                    // if item size not available then accept item
                    return true;
                }
                var size = item.size.split(/\s{1}/)[0]; // size split into value and unit
                var sizeMin = null;
                var sizeMax = null;
                if ('serie' in data) {
                    // if called from TorrentSearchEngines.findEpisode then serie custom search size is available for override
                    sizeMin = ($scope.serie.customSearchSizeMin !== null) ? $scope.serie.customSearchSizeMin : $scope.globalSizeMin;
                    sizeMax = ($scope.serie.customSearchSizeMax !== null) ? $scope.serie.customSearchSizeMax : $scope.globalSizeMax;
                } else {
                    sizeMin = $scope.globalSizeMin;
                    sizeMax = $scope.globalSizeMax;
                }
                // set up accepted size range
                sizeMin = (sizeMin == null) ? 0 : sizeMin;
                sizeMax = (sizeMax == null) ? Number.MAX_SAFE_INTEGER : sizeMax;
                // ignore global and custom search size min ?
                sizeMin = ($scope.globalSizeMinEnabled) ? sizeMin : 0;
                // ignore global and custom search size max ?
                sizeMax = ($scope.globalSizeMaxEnabled) ? sizeMax : Number.MAX_SAFE_INTEGER;
                return (size >= sizeMin && size <= sizeMax);
            };

            /**
             * drop duplicates from results by matching releasename
             */
            function dropDuplicates(items) {
                var arr = {};
                for ( var i = 0, len = items.length; i < len; i++ ) {
                    arr[items[i]['releasename']] = items[i];
                }
                items = new Array();
                for ( var key in arr ) {
                    items.push(arr[key]);
                }
                return items;
            };

            TorrentSearchEngines.getSearchEngine($scope.searchprovider).search([q, $scope.searchquality].join(' '), undefined, $scope.orderBy).then(function(results) {
                $scope.items = results.filter(filterBySize);
                $scope.items = $scope.items.filter(filterByScore);
                if ($scope.globalIncludeAny) {
                    $scope.items = $scope.items.filter(filterGlobalInclude);
                }
                $scope.items = $scope.items.filter(filterGlobalExclude);
                $scope.items = dropDuplicates($scope.items);
                $scope.searching = false;
            },
            function(e) {
                $scope.searching = false;
                $scope.error = e;
                $scope.items = null;
            });
        };

        // Save state of torrenting global include check-box
        $scope.setGlobalIncludeState = function() {
            SettingsService.set('torrenting.global_include_enabled', $scope.globalIncludeEnabled);
            $scope.search($scope.query, undefined, $scope.orderBy);
        };

        // Save state of torrenting global exclude check-box
        $scope.setGlobalExcludeState = function() {
            SettingsService.set('torrenting.global_exclude_enabled', $scope.globalExcludeEnabled);
            $scope.search($scope.query, undefined, $scope.orderBy);
        };

        // Save state of torrenting global size min check-box
        $scope.setGlobalSizeMinState = function() {
            SettingsService.set('torrenting.global_size_min_enabled', $scope.globalSizeMinEnabled);
            $scope.search($scope.query, undefined, $scope.orderBy);
        };

        // Save state of torrenting global size max check-box
        $scope.setGlobalSizeMaxState = function() {
            SettingsService.set('torrenting.global_size_max_enabled', $scope.globalSizeMaxEnabled);
            $scope.search($scope.query, undefined, $scope.orderBy);
        };

        // Changes the search quality while searching for a torrent
        $scope.setQuality = function(quality) {
            $scope.searchquality = quality;
            $scope.search($scope.query, undefined, $scope.orderBy);
        };

        // Changes what search provider you search with
        $scope.setProvider = function(provider) {
            $scope.searchprovider = provider;
            var provider = TorrentSearchEngines.getSearchEngine($scope.searchprovider);
            if ('config' in provider && 'orderby' in provider.config) {
                // load this provider's orderBy list
                $scope.orderByList = Object.keys(provider.config.orderby);
            } else {
                // this provider does not support orderBy sorting
                $scope.orderByList = [];
            }
            // reset orderBy since the new provider may not have the currently active orderBy param
            $scope.orderBy = 'seeders';
            $scope.search($scope.query, undefined, $scope.orderBy);
        };

        // Changes the sort order of the search results
        $scope.setOrderBy = function(orderby) {
            $scope.orderBy = orderby;
            $scope.search($scope.query, undefined, $scope.orderBy);
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };

        // Selects and launches magnet
        var magnetSelect = function(magnet) {
                console.info("Magnet selected!", magnet);
                $modalInstance.close(magnet);

                var channel = $scope.TVDB_ID !== null ? $scope.TVDB_ID : $scope.query;
                TorrentSearchEngines.launchMagnet(magnet, channel);
                // record that this magnet was launched under DuckieTV's control. Used by auto-Stop.
                TorrentHashListService.addToHashList(magnet.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase());
            },

            urlSelect = function(url, releasename) {
                console.info("Torrent URL selected!", url);
                $modalInstance.close(url);

                var channel = $scope.TVDB_ID !== null ? $scope.TVDB_ID : $scope.query;
                $injector.get('$http').get(url, {
                    responseType: 'blob'
                }).then(function(result) {
                    try {
                        TorrentSearchEngines.launchTorrentByUpload(result.data, channel, releasename);
                    } catch (E) {
                        TorrentSearchEngines.launchTorrentByURL(url, channel, releasename);
                    }
                });
            };

        $scope.select = function(result) {
            var config = TorrentSearchEngines.getSearchEngine($scope.searchprovider).config;
            if (config && 'noMagnet' in config && config.noMagnet) {
                return urlSelect(result.torrentUrl, result.releasename);
            } else {
                return magnetSelect(result.magneturl);
            }
        };

        /*
         * Takes the English orderBy (elements from TorrentSearchEngines.getSearchEngine($scope.searchprovider).config.orderby) and returns a translation
         */
        $scope.translateOrderBy = function(orderBy) {
            var idx = $scope.engOrderByList.indexOf(orderBy);
            return (idx != -1) ? $scope.translatedOrderByList[idx] : 'n/a';
        };

        $scope.search($scope.query, undefined, $scope.orderBy);
    }
])

.directive('torrentDialog', ["TorrentSearchEngines", "$filter", "SettingsService",
    function(TorrentSearchEngines, $filter, SettingsService) {
        if (!SettingsService.get('torrenting.enabled')) {
            // if torrenting features are disabled hide
            return {
                template: '<a></a>'
            }
        } else {
            return {
                restrict: 'E',
                transclude: true,
                wrap: true,
                replace: true,
                scope: {
                    q: '=q',
                    TVDB_ID: '=tvdbid',
                    serie: '=serie',
                    episode: '=episode'
                },
                template: '<a class="torrent-dialog" ng-click="openDialog()" uib-tooltip="{{getTooltip()}}"><i class="glyphicon glyphicon-download"></i><span ng-transclude></span></a>',
                controller: ["$scope",
                    function($scope) {
                        // Translates the tooltip
                        $scope.getTooltip = function() {
                            if ($scope.q) {
                                return $filter('translate')('TORRENTDIALOG/search-download-this/tooltip') + $scope.q;
                            } else if ($scope.episode && $scope.serie) {
                                return $filter('translate')('TORRENTDIALOG/search-download-this/tooltip') + $scope.serie.name + ' ' + $scope.episode.getFormattedEpisode();
                            } else {
                                return $filter('translate')('TORRENTDIALOG/search-download-any/tooltip');
                            }
                        };
                        // Opens the torrent search with the episode selected
                        $scope.openDialog = function() {
                            if ($scope.serie && $scope.episode) {
                                TorrentSearchEngines.findEpisode($scope.serie, $scope.episode);
                            } else {
                                TorrentSearchEngines.search($scope.q, $scope.TVDB_ID);
                            }
                        };
                    }
                ]
            };
        }
    }
])


.run(["TorrentSearchEngines", "SettingsService",
    function(TorrentSearchEngines, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {

            // delay for 500ms so that custom clients can register themselves before determining default engine. 
            setTimeout(function() {

                var providers = TorrentSearchEngines.getSearchEngines();
                if (!(SettingsService.get('torrenting.searchprovider') in providers)) {
                    // auto-config migration, fallback to first provider in the list when we detect an invalid provider.
                    console.warn("Invalid search provider detected: ", SettingsService.get('torrenting.searchprovider'), " defaulting to ", Object.keys(providers)[0]);
                    SettingsService.set('torrenting.searchprovider', Object.keys(providers)[0]);
                }
                TorrentSearchEngines.setDefault(SettingsService.get('torrenting.searchprovider'));

            }, 500);
        }
    }
]);
