DuckieTV

    .controller('torrentDialog2Ctrl', ["$scope", "$rootScope", "$uibModalInstance", "$injector", "$filter", "data", "TorrentSearchEngines", "SettingsService", "TorrentHashListService",
    function($scope, $rootScope, $modalInstance, $injector, $filter, data, TorrentSearchEngines, SettingsService, TorrentHashListService) {
        //-- Variables --//

        $scope.searching = true;
        $scope.error = false;
        $scope.query = angular.copy(data.query);
        $scope.TVDB_ID = angular.copy(data.TVDB_ID);
        $scope.serie = angular.copy(data.serie);
        $scope.episode = angular.copy(data.episode);
        $scope.showAdvanced = SettingsService.get('torrentDialog.showAdvanced.enabled'); // Show/Hide advanced torrent dialog filter options
        $scope.searchquality = SettingsService.get('torrenting.searchquality');
        if ('serie' in data && $scope.serie.ignoreGlobalQuality != 0) {
            $scope.searchquality = ''; // override quality when the series has the IgnoreQuality flag enabled.
        }
        $scope.requireKeywords = SettingsService.get('torrenting.global_include');
        $scope.requireKeywordsAny = SettingsService.get('torrenting.global_include_any'); // set the GIL mode (Any or All)
        $scope.requireKeywordsEnabled = SettingsService.get('torrenting.global_include_enabled'); // only applies to torrentDialog
        if ('serie' in data && $scope.serie.ignorerequireKeywordss != 0) {
            $scope.requireKeywordsEnabled = false; // override include-list when the series has the IgnoreIncludeList flag enabled.
        }
        $scope.excludeKeywords = SettingsService.get('torrenting.global_exclude');
        $scope.excludeKeywordsEnabled = SettingsService.get('torrenting.global_exclude_enabled'); // only applies to torrentDialog
        if ('serie' in data && $scope.serie.ignoreexcludeKeywordss != 0) {
            $scope.excludeKeywordsEnabled = false; // override exclude-list when the series has the IgnoreExcludeList flag enabled.
        }
        $scope.globalSizeMax = SettingsService.get('torrenting.global_size_max'); // torrents larger than this are filtered out
        $scope.globalSizeMaxEnabled = SettingsService.get('torrenting.global_size_max_enabled'); // only applies to torrentDialog
        $scope.globalSizeMin = SettingsService.get('torrenting.global_size_min'); // torrents smaller than this are filtered out
        $scope.globalSizeMinEnabled = SettingsService.get('torrenting.global_size_min_enabled'); // only applies to torrentDialog
        $scope.sortByDir = {
            'sortname': '-',
            'engine': '+',
            'seedersInt': '+',
            'leechersInt': '+',
            'sizeInt': '+'
        }; // the default sort direction for each possible sortBy
        $scope.sortBy = '+engine'; // the default order
        $scope.items = [];
        $scope.defaultProvider = SettingsService.get('torrenting.searchprovider');
        $scope.clients = Object.keys(TorrentSearchEngines.getSearchEngines());
        $scope.activeSE = SettingsService.get('torrentDialog.2.activeSE'); // get active search engines previously saved
        $scope.clients.forEach(function(name) {
            // add any new search engines discovered, default them as active.
            if (!(name in $scope.activeSE)) {
                $scope.activeSE[name] = true;
            }
        });
        SettingsService.set('torrentDialog.2.activeSE', $scope.activeSE); // save updated active SE list.

        // Changes the sort order of the search results
        $scope.setSortBy = function(sortby) {
            $scope.sortByDir[sortby] === '-' ? $scope.sortByDir[sortby] = '+' : $scope.sortByDir[sortby] = '-'; // flip sort direction
            $scope.sortBy = $scope.sortByDir[sortby] + sortby;
        };

        var usingLabel = SettingsService.get('torrenting.label');

        $scope.search = function(q, TVDB_ID) {
            $scope.searching = true;
            $scope.error = false;
            $scope.query = q;
            if (TVDB_ID !== undefined) {
                $scope.TVDB_ID = TVDB_ID;
            }
            // If query is empty, prompt user to enter something
            if (q === null || q === "" || q === undefined) {
                $scope.searching = false;
                $scope.error = 'null';
                $scope.items = null;
                return;
            }

            /**
             * Word-by-word scoring for search results.
             * All words need to be in the search result's release name, or the result will be filtered out.
             */
            function filterByScore(item) {
                var score = 0;
                var GIL_String = $scope.requireKeywordsEnabled ? $scope.requireKeywordsAny ? '' : $scope.requireKeywords : ''; // if GIL mode is ALL then add GIL to q
                // ignore double-quotes and plus symbols on query, and any query minus words
                var query = [q, $scope.searchquality, GIL_String].join(' ').toLowerCase().replace(/[\"\+]/g, ' ').trim().split(' ');
                var name = item.releasename.toLowerCase();
                query.map(function(part) {
                    if (part[0] === '-' || name.indexOf(part) > -1) {
                        score++;
                    }
                });
                return (score == query.length);
            }

            /**
             * Any words in the global include list causes the result to be filtered in.
             */
            function filterrequireKeywords(item) {
                if (!$scope.requireKeywordsEnabled || $scope.requireKeywords == '') {
                    return true;
                }
                var score = 0;
                var query = $scope.requireKeywords.toLowerCase().split(' ');
                var name = item.releasename.toLowerCase();
                query.map(function(part) {
                    if (name.indexOf(part) > -1) {
                        score++;
                    }
                });
                return (score > 0);
            }

            /**
             * Any words in the global exclude list causes the result to be filtered out.
             */
            function filterexcludeKeywords(item) {
                if (!$scope.excludeKeywordsEnabled || $scope.excludeKeywords == '') {
                    return true;
                }
                var score = 0;
                var query = $scope.excludeKeywords.toLowerCase().split(' ');
                // prevent the exclude list from overriding the primary search string
                query = query.filter(function(el) {
                    return q.indexOf(el) == -1;
                });
                var name = item.releasename.toLowerCase();
                query.map(function(part) {
                    if (name.indexOf(part) > -1) {
                        score++;
                    }
                });
                return (score == 0);
            }

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
            }

            /**
             * drop duplicates from results by matching detailUrl (or releasename if former is not available)
             */
            function dropDuplicates(items) {
                var arr = {};
                for (var i = 0, len = items.length; i < len; i++) {
                    if (!items[i].detailUrl) {
                        arr[items[i]['releasename']] = items[i];
                    } else {
                        arr[items[i]['detailUrl']] = items[i];
                    }
                }
                items = new Array();
                for (var key in arr) {
                    items.push(arr[key]);
                }
                return items;
            }

            /**
             * Search with each torrent SE for the torrent query
             */
            $scope.items = [];
            $scope.error = false;
            $scope.errorEngine = null;
            $scope.clients.forEach(function(engine) {
                if ($scope.activeSE[engine]) {
                    items = [];
                    $scope.searching = true;
                    provider = TorrentSearchEngines.getSearchEngine(engine);
                    provider.search([q, $scope.searchquality].join(' '), undefined, 'seeders.d').then(function(results) {
                            results.forEach(function(item) {
                                item.engine = engine; // used by torrentDialog2.html
                                item.sizeInt = isNaN(item.size.replace(' MB', '')) ? 0 : parseInt(item.size); // used for torrentDialog2 sorting
                                item.seedersInt = isNaN(item.seeders) ? 0 : parseInt(item.seeders); // used for torrentDialog2 sorting
                                item.leechersInt = isNaN(item.leechers) ? 0 : parseInt(item.leechers); // used for torrentDialog2 sorting
                                item.sortname = item.releasename.replace(/\./g, ' ').toLowerCase(); // used for torrentDialog2 sorting
                            });
                            items = results.filter(filterByScore);
                            items = items.filter(filterBySize);
                            if ($scope.requireKeywordsAny) {
                                items = items.filter(filterrequireKeywords);
                            }
                            items = items.filter(filterexcludeKeywords);
                            // ShowRSS uses the same detailUrl for every episode torrent in a series, so don't dropDuplicates
                            if (engine !== 'ShowRSS') {
                                items = dropDuplicates(items);
                            };
                            $scope.items = $scope.items.concat(items);
                            $scope.searching = false;
                        },
                        function(e) {
                            $scope.searching = false;
                            if (e !== null && typeof e === 'object' && 'status' in e && 'statusText' in e) {
                                var errorText = 'status ' + e.status + ' ' + e.statusText;
                            } else {
                                var errorText = e.toString();
                            }
                            if ($scope.errorEngine == null) {
                                $scope.error = errorText;
                                $scope.errorEngine = engine;
                            } else {
                                $scope.error = $scope.error + '\n' + errorText;
                                $scope.errorEngine = $scope.errorEngine + '\n' + engine;
                            }
                            items = null;
                        });
                }
            });
        };

        // Save state of torrenting global include check-box
        $scope.setrequireKeywordsState = function() {
            SettingsService.set('torrenting.global_include_enabled', $scope.requireKeywordsEnabled);
            $scope.search($scope.query, undefined, 'seeders.d');
        };

        // Save state of torrenting global exclude check-box
        $scope.setexcludeKeywordsState = function() {
            SettingsService.set('torrenting.global_exclude_enabled', $scope.excludeKeywordsEnabled);
            $scope.search($scope.query, undefined, 'seeders.d');
        };

        // Save state of torrenting global size min check-box
        $scope.setGlobalSizeMinState = function() {
            SettingsService.set('torrenting.global_size_min_enabled', $scope.globalSizeMinEnabled);
            $scope.search($scope.query, undefined, 'seeders.d');
        };

        // Save state of torrenting global size max check-box
        $scope.setGlobalSizeMaxState = function() {
            SettingsService.set('torrenting.global_size_max_enabled', $scope.globalSizeMaxEnabled);
            $scope.search($scope.query, undefined, 'seeders.d');
        };

        // Changes the search quality while searching for a torrent
        $scope.setQuality = function(quality) {
            $scope.searchquality = quality;
            $scope.search($scope.query, undefined, 'seeders.d');
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };

        // Toggle advanced filter state
        $scope.toggleShowAdvanced = function() {
            $scope.showAdvanced = !$scope.showAdvanced;
            SettingsService.set('torrentDialog.showAdvanced.enabled', $scope.showAdvanced);
        };

        // save active Search Engine states
        $scope.toggleSE = function(name) {
            $scope.activeSE[name] = !$scope.activeSE[name];
            SettingsService.set('torrentDialog.2.activeSE', $scope.activeSE);
            $scope.search($scope.query, undefined, 'seeders.d');
        };

        // Selects and launches magnet
        var magnetSelect = function(magnet, dlPath, label) {
                //console.debug("Magnet selected!", magnet, dlPath, label);
                if (typeof $scope.episode !== 'undefined') { // don't close dialogue if search is free-form
                    $modalInstance.close(magnet);
                }

                var channel = $scope.TVDB_ID !== null ? $scope.TVDB_ID : $scope.query;
                TorrentSearchEngines.launchMagnet(magnet, channel, dlPath, label);
                // record that this magnet was launched under DuckieTV's control. Used by auto-Stop.
                TorrentHashListService.addToHashList(magnet.getInfoHash());
            },

            urlSelect = function(url, releasename, dlPath, label) {
                //console.debug("Torrent URL selected!", url, dlPath, label);
                if (typeof $scope.episode !== 'undefined') { // don't close dialogue if search is free-form
                    $modalInstance.close(url);
                }

                var channel = $scope.TVDB_ID !== null ? $scope.TVDB_ID : $scope.query;
                $injector.get('$http').get(url, {
                    responseType: 'blob'
                }).then(function(result) {
                    try {
                        TorrentSearchEngines.launchTorrentByUpload(result.data, channel, releasename, dlPath, label);
                    } catch (E) {
                        TorrentSearchEngines.launchTorrentByURL(url, channel, releasename, dlPath, label);
                    }
                });
            };

        $scope.select = function(result) {
            //console.debug('select', result);
            var dlPath = ($scope.serie) ? $scope.serie.dlPath : null;
            var label = ($scope.serie && usingLabel) ? $scope.serie.name : null;
            if (result.magnetUrl) {
                //console.debug('using search magnet');
                return magnetSelect(result.magnetUrl, dlPath, label);
            } else if (result.torrentUrl) {
                //console.debug('using search torrent');
                return urlSelect(result.torrentUrl, result.releasename, dlPath, label);
            } else {
                TorrentSearchEngines.getSearchEngine(result.engine).getDetails(result.detailUrl, result.releasename).then(function(details) {
                    if (details.magnetUrl) {
                        //console.debug('using details magnet');
                        return magnetSelect(details.magnetUrl, dlPath, label);
                    } else if (details.torrentUrl) {
                        //console.debug('using details torrent');
                        return urlSelect(details.torrentUrl, result.releasename, dlPath, label);
                    }
                });
            }
        };

        function openUrl(id, url) {
            if ((navigator.userAgent.toLowerCase().indexOf('standalone') !== -1) && id === 'magnet') {
                // for standalone, open magnet url direct to os https://github.com/SchizoDuckie/DuckieTV/issues/834
                require('nw.gui').Shell.openExternal(url);
                //console.debug("Open via OS", id, url);
            } else {
                // for chrome extension, open url on chromium via iframe
                var d = document.createElement('iframe');
                d.id = id + 'url_' + new Date().getTime();
                d.style.visibility = 'hidden';
                d.src = url;
                document.body.appendChild(d);
                //console.debug("Open via Chromium", d.id, url);
                var dTimer = setInterval(function() {
                    var dDoc = d.contentDocument || d.contentWindow.document;
                    if (dDoc.readyState == 'complete') {
                        document.body.removeChild(d);
                        clearInterval(dTimer);
                        return;
                    }
                }, 1500);
            }
        }

        $scope.submitMagnetLink = function(result) {
            if (result.magnetUrl) {
                // we have magnetUrl from search, use it
                openUrl('magnet', result.magnetUrl);
            } else {
                // we don't have magnetUrl from search, fetch from details instead
                TorrentSearchEngines.getSearchEngine(result.engine).getDetails(result.detailUrl, result.releasename).then(function(details) {
                    if (details.magnetUrl) {
                        openUrl('magnet', details.magnetUrl);
                    }
                });
            }
        }

        $scope.submitTorrentLink = function(result) {
            if (result.torrentUrl) {
                // we have torrentUrl from search, use it
                openUrl('torrent', result.torrentUrl);
            } else {
                // we don't have torrentUrl from search, fetch from details instead
                TorrentSearchEngines.getSearchEngine(result.engine).getDetails(result.detailUrl, result.releasename).then(function(details) {
                    if (details.torrentUrl) {
                        openUrl('torrent', details.torrentUrl);
                    }
                });
            }
        }

        $scope.search($scope.query, undefined, 'seeders.d');
    }
])

.directive('torrentDialog2', ["TorrentSearchEngines", "$filter", "SettingsService",
    function(TorrentSearchEngines, $filter, SettingsService) {
        if (!SettingsService.get('torrenting.enabled')) {
            // if torrenting features are disabled hide
            return {
                template: '<a></a>'
            };
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
]);