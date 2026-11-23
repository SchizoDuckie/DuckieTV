// The overview reads the library independently of the visible calendar and scheduler.
DuckieTV.controller('AutoDownloadOverviewCtrl', ['$scope', '$q', '$timeout', '$translate', 'FavoritesService', 'SettingsService', 'DuckieTorrent', 'TorrentSearchEngines', 'AutoDownloadService', 'InAppAlerts',
  function($scope, $q, $timeout, $translate, FavoritesService, SettingsService, DuckieTorrent, TorrentSearchEngines, AutoDownloadService, InAppAlerts) {
    var vm = this
    var pageSize = 100
    var limit = pageSize
    var rows = new Map()
    var tracked = new Set()
    var busy = new Set()
    var findRow = null
    var generation = 0
    var reloadTimer
    var statusQueued = false
    var closed = false
    vm.filters = { groupByDay: true, hideDownloaded: false, hideWatched: false, query: '', showImages: true }
    vm.groups = []
    vm.count = vm.activeCount = 0

    function midnight(value) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate())
    }

    vm.editRange = function() {
      vm.draftFrom = new Date(vm.from)
      vm.draftTo = new Date(vm.to)
    }

    vm.setDays = function(days) {
      vm.days = days
      vm.to = midnight(new Date())
      vm.from = new Date(vm.to)
      vm.from.setDate(vm.from.getDate() - days + 1)
      limit = pageSize
      vm.rangeOpen = false
      return vm.reload()
    }

    vm.applyRange = function() {
      if (!(vm.draftFrom instanceof Date) || !(vm.draftTo instanceof Date) ||
          !Number.isFinite(+vm.draftFrom) || !Number.isFinite(+vm.draftTo) || vm.draftFrom > vm.draftTo) return false
      vm.days = null
      vm.from = midnight(vm.draftFrom)
      vm.to = midnight(vm.draftTo)
      limit = pageSize
      vm.rangeOpen = false
      vm.reload()
      return true
    }

    /**
     * Combine the saved episode state with the current client snapshot. Pending
     * means the torrent exists but has no usable progress, missing means a
     * connected client cannot find its hash, and offline means no client snapshot
     * is available. If the configured launch path is external and there is
     * no matching torrent, mark the episode untracked.
     */
    function updateStatus(row, client) {
      var episode = row.episode
      var hash = episode.magnetHash
      row.progress = null
      row.torrentName = ''
      row.watched = !!episode.isWatched()
      row.downloaded = !!episode.isDownloaded()
      row.status = row.downloaded ? 'complete' : 'none'
      if (!hash) {
        tracked.delete(row)
        return
      }
      tracked.add(row)
      var external = client && client.getName() === 'None'
      var remote = client && !external && client.isConnected() && client.getRemote()
      var torrent = remote && remote.getByHash(String(hash).toUpperCase())
      if (torrent && torrent.hash) {
        var name = torrent.getName()
        // Some clients return the info hash while fetching torrent metadata.
        if (typeof name === 'string' && name.trim().toLowerCase() !== String(hash).toLowerCase()) {
          row.torrentName = name.trim()
        }
        var progress = torrent.getProgress()
        if (progress != null && Number.isFinite(Number(progress))) {
          row.progress = Math.max(0, Math.min(100, Number(progress)))
          row.downloaded = row.downloaded || row.progress === 100
          row.status = row.progress === 100 ? 'complete' : (torrent.isStarted() ? 'downloading' : 'paused')
        } else {
          row.status = 'pending'
        }
      } else if (!row.downloaded) {
        if (external || SettingsService.get('torrenting.launch_via_chromium')) row.status = 'untracked'
        else row.status = remote ? 'missing' : 'offline'
      }
    }

    // Count all filtered rows while limiting rendered rows to the current page.
    function regroup() {
      var query = (vm.filters.query || '').toLowerCase().trim()
      var groups = []
      var group
      vm.count = vm.activeCount = 0
      rows.forEach(function(row) {
        if ((vm.filters.hideDownloaded && row.downloaded) || (vm.filters.hideWatched && row.watched) ||
            (query && !row.search.includes(query))) return
        vm.count++
        if (row.status === 'downloading') vm.activeCount++
        var day = vm.filters.groupByDay ? row.day : null
        if (!group || Number(group.day) !== Number(day)) {
          group = { day: day, rows: [], count: 0 }
          if (vm.count <= limit) groups.push(group)
        }
        group.count++
        if (vm.count <= limit) group.rows.push(row)
      })
      vm.groups = groups
      vm.hasMore = vm.count > limit
    }

    vm.filter = function() {
      limit = pageSize
      regroup()
    }
    vm.loadMore = function() {
      limit += pageSize
      regroup()
    }

    /**
     * Reload the selected air-date range. Only the latest request may replace
     * rows or loading state, including when an older request fails or the view closes.
     * Background refreshes keep existing rows visible while the query runs.
     */
    vm.reload = function(background) {
      var request = ++generation
      var end = new Date(vm.to)
      end.setHours(23, 59, 59, 999)
      vm.loading = vm.loading || !background || !rows.size
      vm.error = false
      // Keep the full range searchable. Only the visible page is compiled into Angular rows.
      return $q.when(FavoritesService.getEpisodesForDateRange(+vm.from, +end, { limit: -1, orderBy: 'firstaired DESC, ID_Episode ASC' })).then(function(episodes) {
        if (request !== generation) return
        var shows = new Map(FavoritesService.favorites.map(function(serie) { return [String(serie.ID_Serie), serie] }))
        var client = DuckieTorrent.getClient()
        rows.clear()
        tracked.clear()
        episodes.forEach(function(episode) {
          var serie = shows.get(String(episode.ID_Serie))
          if (!serie) return
          var code = episode.seasonnumber != null && episode.episodenumber != null ? episode.getFormattedEpisode().toUpperCase() : ''
          var image = serie.fanart || serie.poster
          var row = {
            id: episode.ID_Episode, day: midnight(new Date(Number(episode.firstaired))), serie: serie, episode: episode,
            code: code, search: [serie.name, serie.alias, code, episode.episodename].join(' ').toLowerCase(),
            image: image && image.replace(/^(https?:\/\/image\.tmdb\.org\/t\/p\/)original\//, '$1w300/'),
            canDownload: !!code && !!(episode.hasAired() || episode.isLeaked()), busy: busy.has(episode.ID_Episode)
          }
          updateStatus(row, client)
          rows.set(row.id, row)
        })
        regroup()
      }).catch(function() {
        if (request !== generation) return
        rows.clear()
        tracked.clear()
        regroup()
        vm.error = true
      }).finally(function() {
        if (request === generation) vm.loading = false
      })
    }

    function alertError(key, row) {
      var episode = row.serie.name + ' ' + row.code
      InAppAlerts.show('error', $translate.instant(key, { episode: episode }, undefined, undefined, []))
    }

    // A reload may have replaced the row during an action. Update the current
    // row by ID and avoid touching the view after it has been destroyed.
    function finishAction(row) {
      busy.delete(row.id)
      var current = rows.get(row.id)
      if (!current || closed) return
      current.busy = false
      updateStatus(current, DuckieTorrent.getClient())
      regroup()
    }

    // Prevent concurrent actions on an episode and avoid resubmitting an active torrent.
    vm.autoDownload = function(row) {
      if (!SettingsService.get('torrenting.enabled') || !row.canDownload || busy.has(row.id) ||
          ['downloading', 'paused', 'pending'].includes(row.status)) return
      busy.add(row.id)
      row.busy = true
      return $q.when(AutoDownloadService.autoDownload(row.serie, row.episode, true)).finally(function() {
        finishAction(row)
      })
    }

    // Only one Find dialog is open at a time so torrent:select can identify its row.
    vm.find = function(row) {
      if (!SettingsService.get('torrenting.enabled') || !row.canDownload || busy.has(row.id) || findRow) return
      busy.add(row.id)
      row.busy = true
      findRow = row
      return $q.when().then(function() {
        if (row.episode.TRAKT_ID == null) {
          // Old libraries can have no Trakt ID. Give the dialog a stable selection channel.
          return TorrentSearchEngines.findEpisode(row.serie, row.episode, 'overview-episode-' + row.id)
        }
        return TorrentSearchEngines.findEpisode(row.serie, row.episode)
      }).then(function(dialog) {
        // Dismissing the dialog is a normal outcome.
        return dialog.result.catch(angular.noop)
      }).catch(function() {
        alertError('AUTODLOVERVIEW/find-error/lbl', row)
      }).finally(function() {
        findRow = null
        finishAction(row)
      })
    }

    // Both manual dialogs and the scheduler can start downloads while this page is open.
    $scope.$on('torrent:select', function(event, traktID, hash) {
      var selected = findRow && (findRow.episode.TRAKT_ID ?? 'overview-episode-' + findRow.id) == traktID ? findRow : null
      if (selected) {
        // Auto Download persists its own selection. A Find selection belongs to this view.
        selected.episode.magnetHash = hash
        selected.episode.downloaded = 0
        $q.when(selected.episode.Persist()).catch(function() { alertError('AUTODOWNLOAD/save-error/lbl', selected) })
      }
      rows.forEach(function(row) {
        if ((traktID != null && row.episode.TRAKT_ID == traktID) || (selected && row.id === selected.id)) {
          row.episode.magnetHash = hash
          if (selected) row.episode.downloaded = 0
          updateStatus(row, DuckieTorrent.getClient())
        }
      })
      regroup()
    })

    // Each client poll broadcasts once per torrent. Refresh tracked rows once per batch.
    function queueStatus() {
      if (statusQueued || !tracked.size) return
      statusQueued = true
      $scope.$evalAsync(function() {
        statusQueued = false
        var client = DuckieTorrent.getClient()
        var membershipChanged = false
        tracked.forEach(function(row) {
          var status = row.status
          var downloaded = row.downloaded
          updateStatus(row, client)
          if (status !== row.status || downloaded !== row.downloaded) membershipChanged = true
        })
        if (membershipChanged) regroup()
      })
    }
    $scope.$on('torrent:update:', queueStatus)
    $scope.$watchGroup([DuckieTorrent.getClient, function() { return DuckieTorrent.getClient()?.isConnected() }], queueStatus)

    var episodeActions = ['watched', 'notwatched', 'downloaded', 'notdownloaded']
    episodeActions.forEach(function(action) {
      $scope.$on('episode:marked:' + action, function(event, episode) {
        var row = rows.get(episode.ID_Episode)
        if (!row) return
        row.episode = episode
        updateStatus(row, DuckieTorrent.getClient())
        regroup()
        $scope.$applyAsync()
      })
    })
    $scope.$on('storage:update', function() {
      $timeout.cancel(reloadTimer)
      reloadTimer = $timeout(function() { vm.reload(true) }, 200)
    })
    $scope.$on('$destroy', function() {
      closed = true
      generation++
      $timeout.cancel(reloadTimer)
    })
    vm.setDays(30)
  }
])
