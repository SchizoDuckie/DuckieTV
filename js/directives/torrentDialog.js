DuckieTV
  .controller('torrentDialogCtrl', ['$scope', '$uibModalInstance', '$injector', 'data', 'TorrentSearchEngines', 'SettingsService', 'NotificationService', 'DuckieTorrent',
    function($scope, $modalInstance, $injector, data, TorrentSearchEngines, SettingsService, NotificationService, DuckieTorrent) {
      // -- Variables --//

      $scope.items = []
      $scope.searching = true
      $scope.error = false
      $scope.query = angular.copy(data.query)
      $scope.TRAKT_ID = angular.copy(data.TRAKT_ID)
      $scope.serie = angular.copy(data.serie)
      $scope.episode = angular.copy(data.episode)
      $scope.showAdvanced = SettingsService.get('torrentDialog.showAdvanced.enabled') // Show/Hide advanced torrent dialog filter options
      $scope.orderBy = 'seeders.d' // default sort column and sort direction (descending)
      $scope.searchprovider = SettingsService.get('torrenting.searchprovider')
      $scope.searchquality = SettingsService.get('torrenting.searchquality')
      $scope.minSeeders = SettingsService.get('torrenting.min_seeders')
      $scope.minSeedersEnabled = SettingsService.get('torrenting.min_seeders_enabled') // only applies to torrentDialog
      if ('serie' in data && $scope.serie.ignoreGlobalQuality != 0) {
        $scope.searchquality = '' // override quality when the series has the IgnoreQuality flag enabled.
      }
      $scope.requireKeywords = SettingsService.get('torrenting.require_keywords')
      $scope.requireKeywordsModeOR = SettingsService.get('torrenting.require_keywords_mode_or') // set the Require Keywords mode (Any or All)
      $scope.requireKeywordsEnabled = SettingsService.get('torrenting.require_keywords_enabled') // only applies to torrentDialog
      if ('serie' in data && $scope.serie.ignoreGlobalIncludes != 0) {
        $scope.requireKeywordsEnabled = false // override include-list when the series has the IgnoreIncludeList flag enabled.
      }
      $scope.ignoreKeywords = SettingsService.get('torrenting.ignore_keywords')
      $scope.ignoreKeywordsEnabled = SettingsService.get('torrenting.ignore_keywords_enabled') // only applies to torrentDialog
      if ('serie' in data && $scope.serie.ignoreGlobalExcludes != 0) {
        $scope.ignoreKeywordsEnabled = false // override exclude-list when the series has the IgnoreExcludeList flag enabled.
      }
      $scope.globalSizeMax = SettingsService.get('torrenting.global_size_max') // torrents larger than this are filtered out
      $scope.globalSizeMaxEnabled = SettingsService.get('torrenting.global_size_max_enabled') // only applies to torrentDialog
      $scope.globalSizeMin = SettingsService.get('torrenting.global_size_min') // torrents smaller than this are filtered out
      $scope.globalSizeMinEnabled = SettingsService.get('torrenting.global_size_min_enabled') // only applies to torrentDialog
      $scope.clients = Object.keys(TorrentSearchEngines.getSearchEngines())
      var provider = TorrentSearchEngines.getSearchEngine($scope.searchprovider)
      if ('serie' in data && $scope.serie.searchProvider != null) {
        provider = TorrentSearchEngines.getSearchEngine($scope.serie.searchProvider) // override searchProvider when the series has one defined.
        $scope.searchprovider = $scope.serie.searchProvider
      }
      $scope.jackettProviders = TorrentSearchEngines.getJackettEngines()
      $scope.supportsByDir = true // assume provider supports desc and asc sorting
      $scope.orderByDir = {
        'seeders': '.d',
        'leechers': '.a',
        'size': '.a',
        'age': '.d'
      } // the default sort direction for each possible sortBy (NOTE: seeders is flipped)
      if ('config' in provider && 'orderby' in provider.config) {
        $scope.orderByList = Object.keys(provider.config.orderby) // this SE's sort options
        if (provider.config.orderby['seeders']['d'] === provider.config.orderby['seeders']['a']) {
          // provider does not support desc and asc sorting
          $scope.supportsByDir = false
          $scope.orderByDir = {
            'seeders': '.a',
            'leechers': '.a',
            'size': '.a',
            'age': '.d'
          } // the default sort direction for each possible sortBy
        }
      } else {
        $scope.orderByList = []
      }

      /**
         * is provider a Jackett SE?
         */
      $scope.isJackett = function(jse) {
        return (jse in $scope.jackettProviders && $scope.jackettProviders[jse].enabled)
      }

      $scope.canOrderBy = function(order) {
        return ($scope.orderByList.indexOf(order) > -1)
      }

      $scope.isOrderBy = function(order) {
        return ($scope.orderBy.indexOf(order) > -1)
      }

      $scope.getName = function(provider) {
        return provider
      }

      var usingLabel = SettingsService.get('torrenting.label')

      $scope.search = function(q, TRAKT_ID, orderBy) {
        $scope.searching = true
        $scope.error = false
        $scope.query = q
        if (TRAKT_ID !== undefined) {
          $scope.TRAKT_ID = TRAKT_ID
        }
        if (typeof orderBy !== 'undefined') {
          $scope.orderBy = orderBy
        }
        // If query is empty, prompt user to enter something
        if (q === null || q === '' || q === undefined) {
          $scope.searching = false
          $scope.error = 'null'
          $scope.items = null
          return
        }

        /**
             * Word-by-word scoring for search results.
             * All words need to be in the search result's release name, or the result will be filtered out.
             */
        function filterByScore(item) {
          var score = 0
          var RequireKeywords_String = $scope.requireKeywordsEnabled ? $scope.requireKeywordsModeOR ? '' : $scope.requireKeywords : '' // if Require Keywords mode is AND then add require keywords to q
          // ignore double-quotes and plus symbols on query, and any query minus words
          var query = [q, $scope.searchquality, RequireKeywords_String].join(' ').toLowerCase().replace(/[\"\+]/g, ' ').trim().split(' ')
          var name = item.releasename.toLowerCase()
          query.map(function(part) {
            if (part[0] === '-' || name.indexOf(part) > -1) {
              score++
            }
          })
          return (score == query.length)
        }

        /**
             * Any words in the Require Keywords list causes the result to be filtered in.
             */
        function filterRequireKeywords(item) {
          if (!$scope.requireKeywordsEnabled || $scope.requireKeywords == '') {
            return true
          }
          var score = 0
          var query = $scope.requireKeywords.toLowerCase().split(' ')
          var name = item.releasename.toLowerCase()
          query.map(function(part) {
            if (name.indexOf(part) > -1) {
              score++
            }
          })
          return (score > 0)
        }

        /**
             * Any words in the ignore keyword list causes the result to be filtered out.
             */
        function filterIgnoreKeywords(item) {
          if (!$scope.ignoreKeywordsEnabled || $scope.ignoreKeywords == '') {
            return true
          }
          var score = 0
          var query = $scope.ignoreKeywords.toLowerCase().split(' ')
          // prevent the exclude list from overriding the primary search string
          query = query.filter(function(el) {
            return q.indexOf(el) == -1
          })
          var name = item.releasename.toLowerCase()
          query.map(function(part) {
            if (name.indexOf(part) > -1) {
              score++
            }
          })
          return (score == 0)
        }

        /**
             * Torrent sizes outside min-max range causes the result to be filtered out.
             */
        function filterBySize(item) {
          if (item.size == null || item.size == 'n/a') {
            // if item size not available then accept item
            return true
          }
          var size = item.size.split(/\s{1}/)[0] // size split into value and unit
          var sizeMin = null
          var sizeMax = null
          if ('serie' in data) {
            // if called from TorrentSearchEngines.findEpisode then serie custom search size is available for override
            sizeMin = ($scope.serie.customSearchSizeMin !== null) ? $scope.serie.customSearchSizeMin : $scope.globalSizeMin
            sizeMax = ($scope.serie.customSearchSizeMax !== null) ? $scope.serie.customSearchSizeMax : $scope.globalSizeMax
          } else {
            sizeMin = $scope.globalSizeMin
            sizeMax = $scope.globalSizeMax
          }
          // set up accepted size range
          sizeMin = (sizeMin == null) ? 0 : sizeMin
          sizeMax = (sizeMax == null) ? Number.MAX_SAFE_INTEGER : sizeMax
          // ignore global and custom search size min ?
          sizeMin = ($scope.globalSizeMinEnabled) ? sizeMin : 0
          // ignore global and custom search size max ?
          sizeMax = ($scope.globalSizeMaxEnabled) ? sizeMax : Number.MAX_SAFE_INTEGER
          return (size >= sizeMin && size <= sizeMax)
        }

        /**
             * drop duplicates from results by matching detailUrl (or releasename if former is not available)
             */
        function dropDuplicates(items) {
          var arr = {}
          for (var i = 0, len = items.length; i < len; i++) {
            if (!items[i].detailUrl) {
              arr[items[i]['releasename']] = items[i]
            } else {
              arr[items[i]['detailUrl']] = items[i]
            }
          }
          items = new Array()
          for (var key in arr) {
            items.push(arr[key])
          }
          return items
        }

        /**
             * filter by minimum seeders.
             */
        function filterByMinSeeders(item) {
          if (!$scope.minSeedersEnabled) {
            return true
          }
          return (item.seeders === 'n/a' || parseInt(item.seeders, 10) >= $scope.minSeeders)
        }

        /**
             * Search torrent SE  for the torrent query
             */
        TorrentSearchEngines.getSearchEngine($scope.searchprovider).search([q, $scope.searchquality].join(' ').trim(), undefined, $scope.orderBy).then(function(results) {
          if (localStorage.getItem('debugSE')) {
            if ('serie' in data) {
              console.debug('TD manual search with preloaded series')
            } else {
              console.debug('TD manual search free-form')
            }
            console.debug('sp=[%s]', $scope.searchprovider)
            console.debug('Q=[%s]', q)
            if ('serie' in data) {
              console.debug('cIGQ=[%s]', $scope.serie.ignoreGlobalQuality)
            }
            console.debug('q=[%s]', $scope.searchquality)
            if ('serie' in data) {
              console.debug('cIRK=[%s]', $scope.serie.ignoreGlobalIncludes)
            }
            console.debug('RKe=[%s], RKm=[%s], RK=[%s]', $scope.requireKeywordsEnabled, $scope.requireKeywordsModeOR, $scope.requireKeywords)
            if ('serie' in data) {
              console.debug('cIIK=[%s]', $scope.serie.ignoreGlobalExcludes)
            }
            console.debug('IKe=[%s], IK=[%s]', $scope.ignoreKeywordsEnabled, $scope.ignoreKeywords)
            if ('serie' in data) {
              console.debug('cSmin=[%s], cSmax=[%s]', $scope.serie.customSearchSizeMin, $scope.serie.customSearchSizeMax)
            }
            console.debug('SminE=[%s], Smin=[%s], SmaxE=[%s], Smax=[%s]', $scope.globalSizeMinEnabled, $scope.globalSizeMin, $scope.globalSizeMaxEnabled, $scope.globalSizeMax)
            console.debug('Se=[%s], S=[%s]', $scope.minSeedersEnabled, $scope.minSeeders)
            results.map(function(item) {
              console.debug('releasename=[%s], size=[%s], seeders=[%s]', item.releasename, item.size, item.seeders)
            })
          }
          $scope.items = results.filter(filterByScore)
          if (localStorage.getItem('debugSE')) {
            $scope.items.map(function(item) {
              console.debug('afterFilterByScore: releasename=[%s], size=[%s], seeders=[%s]', item.releasename, item.size, item.seeders)
            })
          }
          $scope.items = $scope.items.filter(filterByMinSeeders)
          if (localStorage.getItem('debugSE')) {
            $scope.items.map(function(item) {
              console.debug('afterFilterByMinSeeders: releasename=[%s], size=[%s], seeders=[%s]', item.releasename, item.size, item.seeders)
            })
          }
          if ($scope.requireKeywordsModeOR) {
            $scope.items = $scope.items.filter(filterRequireKeywords)
            if (localStorage.getItem('debugSE')) {
              $scope.items.map(function(item) {
                console.debug('afterFilterRequireKeywords: releasename=[%s], size=[%s], seeders=[%s]', item.releasename, item.size, item.seeders)
              })
            }
          }
          $scope.items = $scope.items.filter(filterIgnoreKeywords)
          if (localStorage.getItem('debugSE')) {
            $scope.items.map(function(item) {
              console.debug('AfterFilterIgnoreKeywords: releasename=[%s], size=[%s], seeders=[%s]', item.releasename, item.size, item.seeders)
            })
          }
          $scope.items = $scope.items.filter(filterBySize)
          if (localStorage.getItem('debugSE')) {
            $scope.items.map(function(item) {
              console.debug('afterFilterBySize: releasename=[%s], size=[%s], seeders=[%s]', item.releasename, item.size, item.seeders)
            })
          }
          // ShowRSS uses the same detailUrl for all of a series' episodes, so don't call dropDuplicates
          if ($scope.searchprovider !== 'ShowRSS') {
            $scope.items = dropDuplicates($scope.items)
            if (localStorage.getItem('debugSE')) {
              $scope.items.map(function(item) {
                console.debug('afterFilterDuplicates: releasename=[%s], size=[%s], seeders=[%s]', item.releasename, item.size, item.seeders)
              })
            }
          }
          $scope.searching = false
        },
        function(e) {
          $scope.searching = false
          if (e !== null && typeof e === 'object' && 'status' in e && 'statusText' in e) {
            $scope.error = 'status ' + e.status + ' ' + e.statusText
          } else {
            $scope.error = e.toString()
          }
          $scope.items = null
        })
      }

      // Save state of torrenting minSeeders check-box
      $scope.setMinSeedersState = function() {
        SettingsService.set('torrenting.min_seeders_enabled', $scope.minSeedersEnabled)
        $scope.search($scope.query, undefined, $scope.orderBy)
      }

      // Save state of torrenting Require Keywords check-box
      $scope.setRequireKeywordsState = function() {
        SettingsService.set('torrenting.require_keywords_enabled', $scope.requireKeywordsEnabled)
        $scope.search($scope.query, undefined, $scope.orderBy)
      }

      // Save state of torrenting ignore keyword check-box
      $scope.setIgnoreKeywordsState = function() {
        SettingsService.set('torrenting.ignore_keywords_enabled', $scope.ignoreKeywordsEnabled)
        $scope.search($scope.query, undefined, $scope.orderBy)
      }

      // Save state of torrenting global size min check-box
      $scope.setGlobalSizeMinState = function() {
        SettingsService.set('torrenting.global_size_min_enabled', $scope.globalSizeMinEnabled)
        $scope.search($scope.query, undefined, $scope.orderBy)
      }

      // Save state of torrenting global size max check-box
      $scope.setGlobalSizeMaxState = function() {
        SettingsService.set('torrenting.global_size_max_enabled', $scope.globalSizeMaxEnabled)
        $scope.search($scope.query, undefined, $scope.orderBy)
      }

      // Changes the search quality while searching for a torrent
      $scope.setQuality = function(quality) {
        $scope.searchquality = quality
        $scope.search($scope.query, undefined, $scope.orderBy)
      }

      // Changes what search provider you search with
      $scope.setProvider = function(newProvider) {
        TorrentSearchEngines.getSearchEngine($scope.searchprovider).cancelActiveRequest()
        $scope.searchprovider = newProvider
        provider = TorrentSearchEngines.getSearchEngine($scope.searchprovider)
        $scope.supportsByDir = true // assume provider supports desc and asc sorting
        $scope.orderByDir = {
          'seeders': '.d',
          'leechers': '.a',
          'size': '.a',
          'age': '.d'
        } // the default sort direction for each possible sortBy (NOTE: flipped)
        if ('config' in provider && 'orderby' in provider.config) {
          // load this provider's orderBy list
          $scope.orderByList = Object.keys(provider.config.orderby) // this SE's sort options
          if (provider.config.orderby['seeders']['d'] === provider.config.orderby['seeders']['a']) {
            // provider does not support desc and asc sorting
            $scope.supportsByDir = false
            $scope.orderByDir = {
              'seeders': '.a',
              'leechers': '.a',
              'size': '.a',
              'age': '.d'
            } // the default sort direction for each possible sortBy
          }
        } else {
          // this provider does not support orderBy sorting
          $scope.orderByList = []
        }
        // reset orderBy since the new provider may not have the currently active orderBy param
        $scope.orderBy = 'seeders.d'
        $scope.search($scope.query, undefined, $scope.orderBy)
      }

      // Changes the sort order of the search results
      $scope.setOrderBy = function(orderby) {
        if ($scope.supportsByDir) {
          // provider supports desc and asc sorting, so flip the direction
          $scope.orderByDir[orderby] === '.a' ? $scope.orderByDir[orderby] = '.d' : $scope.orderByDir[orderby] = '.a' // flip sort direction
        }
        $scope.orderBy = orderby + $scope.orderByDir[orderby]
        $scope.search($scope.query, undefined, $scope.orderBy)
      }

      $scope.close = function() {
        $modalInstance.close('Closed')
      }

      // Toggle advanced filter state
      $scope.toggleShowAdvanced = function() {
        $scope.showAdvanced = !$scope.showAdvanced
        SettingsService.set('torrentDialog.showAdvanced.enabled', $scope.showAdvanced)
      }

      // Selects and launches magnet
      var magnetSelect = function(magnet, dlPath, label) {
        // console.debug("Magnet selected!", magnet, dlPath, label);
        if (typeof $scope.episode !== 'undefined') { // don't close dialogue if search is free-form
          $modalInstance.close(magnet)
        }

        var channel = $scope.TRAKT_ID !== null ? $scope.TRAKT_ID : $scope.query
        TorrentSearchEngines.launchMagnet(magnet, channel, dlPath, label)
      }

      var urlSelect = function(url, releasename, dlPath, label) {
        // console.debug("Torrent URL selected!", url, dlPath, label);
        if (typeof $scope.episode !== 'undefined') { // don't close dialogue if search is free-form
          $modalInstance.close(url)
        }

        var channel = $scope.TRAKT_ID !== null ? $scope.TRAKT_ID : $scope.query
        window.parseTorrent.remote(url, function(err, torrentDecoded) {
          if (err) {
            throw err
          }
          var infoHash = torrentDecoded.infoHash.getInfoHash()
          $injector.get('$http').get(url, {
            responseType: 'blob'
          }).then(function(result) {
            try {
              TorrentSearchEngines.launchTorrentByUpload(result.data, infoHash, channel, releasename, dlPath, label)
            } catch (E) {
              TorrentSearchEngines.launchTorrentByURL(url, infoHash, channel, releasename, dlPath, label)
            }
          })
        })
      }

      var debugNotify = function(notificationId) { if (window.debugTSE) console.debug('TD notify id', notificationId) }
      $scope.select = function(result) {
        // console.debug('select', result);
        var dlPath = ($scope.serie) ? $scope.serie.dlPath : null
        var label = ($scope.serie && usingLabel) ? $scope.serie.name : null
        NotificationService.notify(result.releasename,
          'Download started on ' + DuckieTorrent.getClient().getName(),
          debugNotify
        )
        if (result.magnetUrl) {
          // console.debug('using search magnet');
          return magnetSelect(result.magnetUrl, dlPath, label)
        } else if (result.torrentUrl) {
          // console.debug('using search torrent');
          return urlSelect(result.torrentUrl, result.releasename, dlPath, label)
        } else {
          TorrentSearchEngines.getSearchEngine($scope.searchprovider).getDetails(result.detailUrl, result.releasename).then(function(details) {
            if (details.magnetUrl) {
              // console.debug('using details magnet');
              result.magnetUrl = details.magnetUrl
              return magnetSelect(details.magnetUrl, dlPath, label)
            } else if (details.torrentUrl) {
              // console.debug('using details torrent');
              return urlSelect(details.torrentUrl, result.releasename, dlPath, label)
            }
          })
        }
      }

      function openUrl(id, url) {
        // revert back to using iframe, https://github.com/SchizoDuckie/DuckieTV/issues/1308
/*        if (SettingsService.isStandalone() && id === 'magnet') {
          // for standalone, open magnet url direct to os https://github.com/SchizoDuckie/DuckieTV/issues/834
          nw.Shell.openExternal(url)
          // console.debug("Open via OS", id, url);
        } else {*/
          // for chrome extension, open url on chromium via iframe
          var d = document.createElement('iframe')
          d.id = id + 'url_' + new Date().getTime()
          d.style.visibility = 'hidden'
          d.src = url
          document.body.appendChild(d)
          // console.debug("Open via Chromium", d.id, url);
          var dTimer = setInterval(function() {
            var dDoc = d.contentDocument || d.contentWindow.document
            if (dDoc.readyState == 'complete') {
              document.body.removeChild(d)
              clearInterval(dTimer)
              return
            }
          }, 1500)
//        }
      }

      $scope.submitMagnetLink = function(result) {
        if (result.magnetUrl) {
          // we have magnetUrl from search, use it
          openUrl('magnet', result.magnetUrl)
        } else {
          // we don't have magnetUrl from search, fetch from details instead
          TorrentSearchEngines.getSearchEngine($scope.searchprovider).getDetails(result.detailUrl, result.releasename).then(function(details) {
            if (details.magnetUrl) {
              result.magnetUrl = details.magnetUrl
              openUrl('magnet', details.magnetUrl)
            }
          })
        }
        return result
      }

      $scope.submitTorrentLink = function(result) {
        if (result.torrentUrl) {
          // we have torrentUrl from search, use it
          openUrl('torrent', result.torrentUrl)
        } else {
          // we don't have torrentUrl from search, fetch from details instead
          TorrentSearchEngines.getSearchEngine($scope.searchprovider).getDetails(result.detailUrl, result.releasename).then(function(details) {
            if (details.torrentUrl) {
              openUrl('torrent', details.torrentUrl)
            }
          })
        }
      }

      $scope.search($scope.query, undefined, $scope.orderBy)
    }
  ])

  .directive('torrentDialog', ['TorrentSearchEngines', '$filter', 'SettingsService',
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
            TRAKT_ID: '=traktid',
            serie: '=serie',
            episode: '=episode'
          },
          template: '<a class="torrent-dialog" ng-click="openDialog()" uib-tooltip="{{getTooltip()}}"><i class="glyphicon glyphicon-download"></i><span ng-transclude></span></a>',
          controller: ['$scope',
            function($scope) {
              // Translates the tooltip
              $scope.getTooltip = function() {
                if ($scope.q) {
                  return $filter('translate')('TORRENTDIALOG/search-download-this/tooltip') + $scope.q
                } else if ($scope.episode && $scope.serie) {
                  return $filter('translate')('TORRENTDIALOG/search-download-this/tooltip') + $scope.serie.name + ' ' + $scope.episode.getFormattedEpisode()
                } else {
                  return $filter('translate')('TORRENTDIALOG/search-download-any/tooltip')
                }
              }
              // Opens the torrent search with the episode selected
              $scope.openDialog = function() {
                if ($scope.serie && $scope.episode) {
                  TorrentSearchEngines.findEpisode($scope.serie, $scope.episode)
                } else {
                  TorrentSearchEngines.search($scope.q, $scope.TRAKT_ID)
                }
              }
            }
          ]
        }
      }
    }
  ])
