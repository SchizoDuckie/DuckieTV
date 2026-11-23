/**
 * Runs scheduled and manual episode downloads using the configured provider order.
 * Each provider's results are sorted by seeders and filtered before the best match
 * is submitted. Magnet links and torrent files both supply a hash for tracking.
 */
DuckieTV.factory('AutoDownloadService', ['$rootScope', 'InAppAlerts', '$filter', '$translate', 'FavoritesService', 'SceneNameResolver', 'SettingsService', 'TorrentSearchEngines', 'TorrentResultPolicy', 'DuckieTorrent', 'NotificationService',
  function($rootScope, InAppAlerts, $filter, $translate, FavoritesService, SceneNameResolver, SettingsService, TorrentSearchEngines, TorrentResultPolicy, DuckieTorrent, NotificationService) {
    var offClientConnected
    var activityUpdatePending = false

    // Batch activity changes until Angular processes the queued notification.
    function publishActivity() {
      if (activityUpdatePending) return
      activityUpdatePending = true
      $rootScope.$evalAsync(function() {
        activityUpdatePending = false
        $rootScope.$broadcast('autodownload:activity')
      })
    }

    /**
     * Search one provider and return its highest-seeded eligible release.
     * If none qualifies, return the activity status for the first filter that
     * eliminated all candidates. Transport and malformed responses reject.
     */
    async function findRelease(engine, query, policy) {
      var results = await engine.search(query, true)
      if (!Array.isArray(results)) throw new Error('Invalid search response')
      var filtered = TorrentResultPolicy.filter($filter('orderBy')(results, '-seeders'), policy)
      if (filtered.items.length) return { match: filtered.items[0] }
      if (!filtered.counts.score) return { status: 4 }
      if (!filtered.counts.required) return { status: 5, extra: ' RK' }
      if (!filtered.counts.ignored) return { status: 5, extra: ' IK' }
      if (!filtered.counts.size) return { status: 5, extra: ' MS' }
      return { status: 7, extra: filtered.snapshots.size[0].seeders + ' < ' + policy.minSeeders }
    }

    var service = {
      checkTimeout: null,
      activityList: [],
      fromDT: null,
      toDT: null,

      // Store the filter context with each result so the activity monitor can explain it.
      activityUpdate: function(serie, episode, search, status, extra, provider) {
        var csm = 0
        var searchExtra = ''
        if (serie.customSearchSizeMin && serie.customSearchSizeMin != null) {
          csm = 1
          searchExtra = ' (' + serie.customSearchSizeMin.toString() + '/'
        } else {
          searchExtra = ' (-/'
        }
        if (serie.customSearchSizeMax && serie.customSearchSizeMax != null) {
          csm = 1
          searchExtra = searchExtra + serie.customSearchSizeMax.toString() + ')'
        } else {
          searchExtra = searchExtra + '-)'
        }
        if (csm == 0) {
          searchExtra = ''
        }
        var css = (serie.customSearchString && serie.customSearchString != '') ? 1 : 0
        var cs = (serie.customSeeders && serie.customSeeders != null) ? 1 : 0
        if (cs) searchExtra = searchExtra + ' [' + serie.customSeeders + ']'
        var ci = (serie.customIncludes && serie.customIncludes != null) ? 1 : 0
        if (ci) searchExtra = searchExtra + ' {' + serie.customIncludes + '}'
        var ce = (serie.customExcludes && serie.customExcludes != null) ? 1 : 0
        if (ce) searchExtra = searchExtra + ' <' + serie.customExcludes + '>'
        var sp = provider || serie.searchProvider
        service.activityList.push({
          'search': search,
          'searchProvider': sp ? ' (' + sp + ')' : '',
          'searchExtra': searchExtra,
          'csm': csm,
          'css': css,
          'cs': cs,
          'ci': ci,
          'ce': ce,
          'ipq': serie.ignoreGlobalQuality,
          'irk': serie.ignoreGlobalIncludes,
          'iik': serie.ignoreGlobalExcludes,
          'status': status,
          'extra': extra,
          'serie': serie,
          'episode': episode
        })
        publishActivity()
      },

      /**
       * Scan the recent air-date window for scheduled downloads. A new timer is
       * installed before asynchronous work starts, even when the client is offline.
       * A detach or newer scan invalidates pending candidate results, but does not
       * cancel downloads already started by an earlier scan.
       */
      autoDownloadCheck: async function() {
        if (SettingsService.get('torrenting.autodownload') === false) {
          service.detach()
          return
        }

        service.activityList = []
        var period = parseInt(SettingsService.get('autodownload.period')) // Period to check for updates up until today current time, default 1
        var settingsDelay = parseInt(SettingsService.get('autodownload.delay')) // Period in minutes to wait after episode has aired before auto-downloading, default 15m
        var lastRun = SettingsService.get('autodownload.lastrun')

        var from = new Date()
        if (lastRun) {
          from = new Date(lastRun)
        }
        from.setDate(from.getDate() - period) // subtract autodownload period from lastrun for if some episodes weren't downloaded.
        from.setHours(0)
        from.setMinutes(0)
        from.setSeconds(0)
        service.toDT = new Date().getTime()
        service.fromDT = from.getTime()
        publishActivity()
        var showSpecials = SettingsService.get('calendar.show-specials')

        clearTimeout(service.checkTimeout)
        var nextCheck = setTimeout(service.autoDownloadCheck, 1000 * 60 * 15)
        service.checkTimeout = nextCheck

        var client = DuckieTorrent.getClient()
        if (!client || !client.isConnected()) return
        try {
          var remote = await client.AutoConnect()
          var candidates = await FavoritesService.getEpisodesForDateRange(service.fromDT, service.toDT)
          if (service.checkTimeout !== nextCheck) return // detached or superseded during the scan
          var seriesById = new Map()
          FavoritesService.favorites.forEach(function(serie) { seriesById.set(String(serie.ID_Serie), serie) })
          // Start eligible episodes independently. The scan's completion and last-run
          // timestamp do not wait for each provider search or client submission.
          candidates.forEach(function(episode) {
            var serie = seriesById.get(String(episode.ID_Serie))
            if (!serie) return
            var serieEpisode = serie.name + ' ' + episode.getFormattedEpisode()
            // filter out episode from torrent search
            if (episode.seasonnumber === 0 && !showSpecials && serie.ignoreHideSpecials !== 1) {
              service.activityUpdate(serie, episode, serieEpisode, 3, ' HS') // 'autoDL disabled HS'
              return // user has chosen not to show specials on calendar so we assume they do not expect them to be auto-downloaded
            }
            if (serie.displaycalendar !== 1) {
              service.activityUpdate(serie, episode, serieEpisode, 3, ' HC') // 'autoDL disabled HC'
              return // user has chosen not to show series on calendar so we assume they do not expect them to be auto-downloaded
            }
            if (episode.isDownloaded()) {
              service.activityUpdate(serie, episode, serieEpisode, 0) // 'downloaded'
              return // if the episode was already downloaded, skip it.
            }
            if (episode.watchedAt !== null) {
              service.activityUpdate(serie, episode, serieEpisode, 1) // 'watched'
              return // if the episode has been marked as watched, skip it.
            }
            if (episode.magnetHash !== null && (episode.magnetHash in remote.torrents)) {
              service.activityUpdate(serie, episode, serieEpisode, 2) // 'has magnet'
              return // if the episode already has a magnet, skip it.
            }

            /**
             * is episode onair? don't go looking for torrent yet. (saves pointless broadband usage)
             * default onair end-time is calculated as firstaired + runtime minutes + delay minutes
             * episodes with a missing air date are eligible immediately
             * if runtime is null defaults to 60mins
             * delay defaults to 15mins in settings
             */
            var delay = (serie.customDelay) ? parseInt(serie.customDelay) : settingsDelay // override settings delay with series custom delay if used
            delay = (delay > (period * 24 * 60)) ? period * 24 * 60 : delay // sanity check.  Period could have changed after serie.CustomDelay was set.
            var runtime = (serie.runtime) ? parseInt(serie.runtime) : 60
            var episodeAired = episode.firstaired > 0 ? Number(episode.firstaired) + (runtime + delay) * 60000 : service.toDT
            if (episodeAired > service.toDT) {
              var totalMinutesToGo = ((episodeAired - service.toDT) / 1000 / 60)
              var dhm = totalMinutesToGo.minsToDhm()
              if (totalMinutesToGo < (24 * 60)) {
                dhm = dhm.substr(2) // less that 24 hours, strip the leading days
              }
              service.activityUpdate(serie, episode, serieEpisode, 8, ' ' + dhm) // 'onair + delay'
              return // the episode is broadcasting right now
            }

            if (!serie.TVDB_ID) {
              service.activityUpdate(serie, episode, serieEpisode, 9) // 'TVDB_ID missing'
            } else if (serie.autoDownload == 1) {
              service.autoDownload(serie, episode)
            } else {
              service.activityUpdate(serie, episode, serieEpisode, 3) // 'autoDL disabled'
            }
          })

          SettingsService.set('autodownload.lastrun', new Date().getTime())
          publishActivity()
        } catch (error) {
          console.warn('Could not check episodes for scheduled Auto Download', error)
        }
      },

      /**
       * Search providers in order and submit the first eligible release.
       * Resolves with the client outcome, 'no-results', or 'failed'. Manual calls
       * use in-app alerts and scheduled success uses system notifications.
       * 'failed' can also mean saving the hash failed after the client accepted it.
       */
      autoDownload: async function(serie, episode, manual) {
        var hasCustomSeeders = (serie.customSeeders && serie.customSeeders != null) ? 1 : 0
        var hasCustomIncludes = (serie.customIncludes && serie.customIncludes != null) ? 1 : 0
        var hasCustomExcludes = (serie.customExcludes && serie.customExcludes != null) ? 1 : 0

        // Minimum amount of seeders required, default 50, overridden by customSeeders
        var minSeeders = (hasCustomSeeders) ? serie.customSeeders : SettingsService.get('torrenting.min_seeders')
        // Preferred Quality to append to search string.
        var preferredQuality = (serie.ignoreGlobalQuality != 0) ? '' : SettingsService.get('torrenting.searchquality')

        // Any words in the Ignore Keywords list causes the result to be filtered out.
        var ignoreKeywords = (hasCustomExcludes) ? serie.customExcludes + ' ' + SettingsService.get('torrenting.ignore_keywords') : SettingsService.get('torrenting.ignore_keywords')
        // series custom settings specify to ignore the Global Ignore Keywords List
        if (serie.ignoreGlobalExcludes != 0) ignoreKeywords = (hasCustomExcludes) ? serie.customExcludes : ''

        // Any words in the Require Keywords list causes the result to be filtered in.
        var requireKeywords = (hasCustomIncludes) ? serie.customIncludes + ' ' + SettingsService.get('torrenting.require_keywords') : SettingsService.get('torrenting.require_keywords')
        // series custom settings specify to ignore the Global Require Keywords List
        if (serie.ignoreGlobalIncludes != 0) requireKeywords = (hasCustomIncludes) ? serie.customIncludes : ''

        // torrents smaller than this are filtered out
        var globalSizeMin = SettingsService.get('torrenting.global_size_min')
        // torrents larger than this are filtered out
        var globalSizeMax = SettingsService.get('torrenting.global_size_max')
        var label = (SettingsService.get('torrenting.label')) ? serie.name : null

        // set the Require Keywords mode (true=Any or false=All)
        var requireKeywordsModeOR = SettingsService.get('torrenting.require_keywords_mode_or')
        // used to add to query when Require Keywords mode is set to ALL
        var RequireKeywords_String = (requireKeywordsModeOR) ? '' : requireKeywords

        var providers = TorrentSearchEngines.getAutoDownloadProviders(serie.searchProvider)
        var context = { episode: serie.name + ' ' + episode.getFormattedEpisode(), provider: providers[0] }
        var stage = 'search'

        function notify(type, key) {
          if (manual && (type === 'error' || SettingsService.get('notifications.autodownload'))) {
            // Alerts render plain text, including punctuation in show and provider names.
            InAppAlerts.show(type, $translate.instant('AUTODOWNLOAD/' + key + '/lbl', context, undefined, undefined, []))
          }
        }

        try {
          if (!providers.length) {
            notify('error', 'no-providers')
            return 'failed'
          }
          var searchString = await SceneNameResolver.getSearchStringForEpisode(serie, episode)
          var q = [searchString, preferredQuality, RequireKeywords_String].join(' ').trim()
          var sizeMin = serie.customSearchSizeMin != null ? serie.customSearchSizeMin : globalSizeMin
          var sizeMax = serie.customSearchSizeMax != null ? serie.customSearchSizeMax : globalSizeMax
          var policy = {
            scoreQuery: q,
            primaryQuery: q,
            stripSearchPunctuation: false,
            negativeTermsPass: false,
            requireAny: requireKeywordsModeOR,
            requiredKeywords: requireKeywords,
            ignoredKeywords: ignoreKeywords,
            sizeMin: sizeMin,
            sizeMax: sizeMax,
            minSeedersEnabled: true,
            minSeeders: minSeeders,
            deduplicate: false,
            stages: ['score', 'required', 'ignored', 'size', 'seeders']
          }

          // Preserve the first provider error if no later provider succeeds. A
          // clean search with no matches alone produces the no-results outcome.
          var firstFailure
          for (var provider of providers) {
            context.provider = provider
            stage = 'search'
            try {
              var engine = TorrentSearchEngines.getSearchEngine(provider)
              var release = await findRelease(engine, q, policy)
              if (!release.match) {
                service.activityUpdate(serie, episode, q, release.status, release.extra, provider)
                continue
              }
              var match = release.match
              stage = 'source'
              var source = match
              if (!source.magnetUrl && !source.torrentUrl && source.detailUrl) {
                source = await engine.getDetails(source.detailUrl, match.releasename)
              }
              if (!source || (!source.magnetUrl && !source.torrentUrl)) throw new Error('Missing torrent link')
              var infoHash
              if (source.magnetUrl) {
                infoHash = source.magnetUrl.getInfoHash()
                if (!infoHash) throw new Error('Missing magnet hash')
              }

              stage = 'client'
              var client = DuckieTorrent.getClient()
              context.client = client ? client.getName() : SettingsService.get('torrenting.client')
              if (!client) throw new Error('The configured torrent client is unavailable')
              if (!SettingsService.get('torrenting.launch_via_chromium')) await client.AutoConnect()
              var outcome
              if (source.magnetUrl) {
                outcome = await TorrentSearchEngines.launchMagnet(source.magnetUrl, episode.TRAKT_ID, serie.dlPath, label)
              } else {
                var download = await TorrentSearchEngines.launchFromTorrentUrl(source.torrentUrl, episode.TRAKT_ID, match.releasename, serie.dlPath, label)
                infoHash = download.infoHash
                outcome = download.status
              }

              stage = 'save'
              episode.magnetHash = infoHash
              await episode.Persist()
              service.activityUpdate(serie, episode, q, 6, null, provider)
              if (manual) {
                notify('success', outcome)
              } else {
                NotificationService.notify(context.episode, [match.releasename, 'Download started on', context.client].join(' '))
              }
              return outcome
            } catch (error) {
              // Searching another provider is safe only before submitting to the client.
              stage = error && error.stage || stage
              if (stage !== 'search' && stage !== 'source') throw error
              if (!firstFailure) firstFailure = { stage: stage, provider: provider, error: error }
            }
          }
          if (firstFailure) {
            context.provider = firstFailure.provider
            stage = firstFailure.stage
            throw firstFailure.error
          }
          notify('info', 'no-results')
          return 'no-results'
        } catch (error) {
          var failedStage = error && error.stage || stage
          notify('error', failedStage + '-error')
          console.warn('Auto Download failed during ' + failedStage)
          return 'failed'
        }
      },

      // Own one timer and one connection listener across repeated attach calls.
      attach: function() {
        if (!service.checkTimeout) {
          service.checkTimeout = setTimeout(service.autoDownloadCheck, 5000)
          offClientConnected = $rootScope.$on('torrentclient:connected', function() {
            console.info('Caught TorrentClient connected event! starting AutoDownload check!')
            service.autoDownloadCheck()
          })
        }
      },

      // Clearing the timer also invalidates a scan waiting for its candidate query.
      detach: function() {
        if (offClientConnected) offClientConnected()
        offClientConnected = null
        clearTimeout(service.checkTimeout)
        service.checkTimeout = null
      }
    }
    return service
  }
])

/**
 * Attach auto-download check interval when enabled.
 */
DuckieTV.run(['AutoDownloadService', 'SettingsService',
  function(AutoDownloadService, SettingsService) {
    if (SettingsService.get('torrenting.enabled') === true && SettingsService.get('torrenting.autodownload') === true) {
      var timeoutDelay = 5000 // optional customisation for #1062
      if (localStorage.getItem('custom_AutoDownload_delay')) {
        timeoutDelay = localStorage.getItem('custom_AutoDownload_delay')
      }

      setTimeout(function() {
        console.info('Initializing AutoDownload Service!')
        AutoDownloadService.attach()
      }, timeoutDelay)
    }
  }
])
