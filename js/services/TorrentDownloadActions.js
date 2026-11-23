DuckieTV.factory('TorrentDownloadActions', ['$q', '$translate', 'TorrentSearchEngines', 'DuckieTorrent', 'NotificationService', 'InAppAlerts',
  function($q, $translate, TorrentSearchEngines, DuckieTorrent, NotificationService, InAppAlerts) {
    function report(key, provider, result, error) {
      if (error) console.warn('Torrent action failed', provider, error.message || error.statusText || error.status || key)
      // InAppAlerts renders the translated message as plain text.
      InAppAlerts.show('error', $translate.instant('TORRENTDIALOG/' + key + '/lbl', {
        provider: provider,
        release: result.releasename
      }, undefined, undefined, []))
    }

    function findLink(result, kind) {
      if (kind !== 'torrent' && result.magnetUrl) return { kind: 'magnet', url: result.magnetUrl }
      if (kind !== 'magnet' && result.torrentUrl) return { kind: 'torrent', url: result.torrentUrl }
    }

    /**
     * Resolve the requested link kind and cache any links found on the result.
     * Omit kind to prefer magnet links with a torrent file fallback. Missing or
     * unreadable links are reported in the dialog and resolve to undefined.
     */
    function resolveLink(result, provider, kind) {
      return $q.when().then(function() {
        var link = findLink(result, kind)
        if (link || !result.detailUrl) return link

        return TorrentSearchEngines.getSearchEngine(provider).getDetails(result.detailUrl, result.releasename).then(function(details) {
          if (details.magnetUrl) result.magnetUrl = details.magnetUrl
          if (details.torrentUrl) result.torrentUrl = details.torrentUrl
          return findLink(result, kind)
        })
      }).then(function(link) {
        if (!link) report('no-download-link', provider, result)
        return link
      }, function(error) {
        report('details-failed', provider, result, error)
      })
    }

    return {
      /**
       * Submit the chosen result and return its URL on success. The dialog uses
       * the selection channel to associate the launch with an episode. Show a
       * desktop notification only after the configured client accepts the add.
       */
      start: function(result, provider, channel, dlPath, label) {
        return resolveLink(result, provider).then(function(link) {
          if (!link) return

          return $q.when().then(function() {
            if (link.kind === 'magnet') {
              return TorrentSearchEngines.launchMagnet(link.url, channel, dlPath, label)
            }
            return TorrentSearchEngines.launchFromTorrentUrl(link.url, channel, result.releasename, dlPath, label)
          }).then(function(outcome) {
            if (outcome === 'accepted' || outcome?.status === 'accepted') {
              NotificationService.notify(result.releasename, 'Download started on ' + DuckieTorrent.getClient().getName())
            }
            return link.url
          }, function(error) {
            report('launch-failed', provider, result, error)
          })
        })
      },
      /** Open an explicit magnet or torrent link using Chromium's link handler. */
      open: function(result, provider, kind) {
        return resolveLink(result, provider, kind).then(function(link) {
          if (link) return TorrentSearchEngines.openExternalLink(link.kind, link.url)
        }).catch(function(error) {
          report('launch-failed', provider, result, error)
        })
      }
    }
  }
])
