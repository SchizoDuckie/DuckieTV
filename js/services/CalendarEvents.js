/**
 * Owns the visible calendar's episode lists, keyed by local date. The grouped
 * series view is derived from those lists and invalidated when a day changes.
 */
DuckieTV.factory('CalendarEvents', ['$rootScope', 'FavoritesService', 'SettingsService',
  function($rootScope, FavoritesService, SettingsService) {
    var calendarEvents = {}
    var calendarEpisodeSortCache = {}
    var showSpecials = SettingsService.get('calendar.show-specials')

    /* #843
        $rootScope.$on("storage:update", function() {
            console.log("Calendar detected that storage was updated removing deleted.");
            service.removeDeleted();
        }.bind(this))
    */

    /**
     * Check if an episode already exists on a date in the calendar.
     */
    function hasEvent(date, event) {
      return calendarEvents[date].filter(function(el) {
        return el.episode.getID() == event.episode.getID()
      }).length > 0
    }

    /**
     * Add an event to the calendar if it's not already there.
     */
    function addEvent(date, event) {
      if (!hasEvent(date, event)) {
        calendarEvents[date].push(event)
        calendarEvents[date].sort(calendarEpisodeSort)
        delete calendarEpisodeSortCache[date]
      }
    }

    /**
     * Order a day's events by airtime. For a tie, order episodes of the same
     * series by episode number and different series by title.
     */
    function calendarEpisodeSort(a, b) {
      if (a.serie == null || b.serie == null) {
        return 0
      }
      var ad = new Date(a.episode.firstaired_iso).getTime()
      var bd = new Date(b.episode.firstaired_iso).getTime()
      if (ad < bd) return -1
      else if (ad > bd) return 1
      else {
        // air at the same time, now order by title first and if the names match by episode
        if (a.ID_Serie == b.ID_Serie) {
          if (a.episode.episodenumber < b.episode.episodenumber) return -1
          if (a.episode.episodenumber > b.episode.episodenumber) return 1
        } else {
          return a.serie.name < b.serie.name ? -1 : 1
        }
      }
    }

    /**
     * Remove an episode from its old day when the air date changes, including
     * when the new date falls outside the visible range.
     */
    function deleteDuplicates(duplicateID, eventDate) {
      for (var aDate in calendarEvents) {
        if (aDate !== eventDate) {
          var eventList = calendarEvents[aDate]
          for (var index = eventList.length - 1; index > -1; index--) {
            if (eventList[index].episode.getID() === duplicateID) {
              var duplicate = eventList[index]
              calendarEvents[aDate].splice(index, 1)
              delete calendarEpisodeSortCache[aDate]
              return duplicate
            }
          }
        }
      }
    }

    var service = {
      /**
       * Drop episodes whose show is no longer in favorites. Use the local entity
       * ID for older library rows without a Trakt ID.
       */
      removeDeleted: function() {
        var favoriteIDs = new Set(FavoritesService.favoriteIDs.map(String))
        Object.keys(calendarEvents).forEach(function(date) {
          var eventList = calendarEvents[date]
          for (var index = eventList.length - 1; index > -1; index--) {
            var serie = eventList[index].serie
            var favorite = serie && (serie.TRAKT_ID != null
              ? favoriteIDs.has(String(serie.TRAKT_ID))
              : FavoritesService.getByID_Serie(serie.ID_Serie))
            if (!favorite) {
              calendarEvents[date].splice(index, 1)
              delete calendarEpisodeSortCache[date]
            }
          }
        })
      },
      getAllEvents: function() {
        return calendarEvents
      },
      /**
       * Start a new calendar cache for the date picker's grid of weeks. Include
       * the whole final local day, which may span a clock change.
       */
      setVisibleDays: function(range) {
        if (!range || range.length == 1 && range[0].length == 1) return
        var calendarStartDate = new Date(range[0][0])
        var lastWeek = range[range.length - 1]
        var calendarEndDate = new Date(lastWeek[lastWeek.length - 1])
        calendarEndDate.setHours(23, 59, 59, 999)
        calendarEvents = {}
        calendarEpisodeSortCache = {}
        range.forEach(function(week) {
          week.forEach(function(day) {
            calendarEvents[new Date(day).toDateString()] = []
          })
        })
        service.getEventsForDateRange(calendarStartDate, calendarEndDate)
      },

      /**
       * Load episodes within the inclusive Date bounds and attach the cached
       * show entity to each event. Discard results if navigation or a cache
       * reset replaced the visible range while the query was running.
       */
      getEventsForDateRange: function(start, end) {
        var visibleDays = calendarEvents
        return FavoritesService.getEpisodesForDateRange(start.getTime(), end.getTime()).then(function(episodes) {
          if (visibleDays !== calendarEvents) return
          return service.setEvents(episodes.map(function(episode) {
            return {
              start: new Date(episode.firstaired),
              ID_Serie: episode.ID_Serie,
              serie: FavoritesService.getByID_Serie(episode.ID_Serie),
              episode: episode
            }
          }))
        })
      },
      clearCache: function() {
        calendarEvents = {}
        calendarEpisodeSortCache = {}
      },

      /**
       * Merge query results into the visible days. Drop orphaned episodes and
       * honor the global and per-show rules for specials. Reconcile date moves
       * before deciding whether the new day belongs to the current view.
       */
      setEvents: function(events) {
        service.removeDeleted()
        events.forEach(function(event) {
          if (!event.serie) return
          var date = new Date(event.start).toDateString()
          deleteDuplicates(event.episode.getID(), date)
          if (!(date in calendarEvents)) {
            return
          }
          if ((!showSpecials && event.episode.seasonnumber > 0) || showSpecials || event.serie.ignoreHideSpecials == 1) {
            addEvent(date, event)
          }
        })
        $rootScope.$applyAsync()
      },

      /** Apply a saved show's episode map to the current date grid without rerunning the range query. */
      processEpisodes: function(serie, episodes) {
        Object.keys(episodes).map(function(id) {
          var date = new Date(new Date(episodes[id].firstaired).getTime()).toDateString()
          deleteDuplicates(episodes[id].getID(), date)
          if (!(date in calendarEvents)) return
          if (episodes[id].seasonnumber == 0 && !showSpecials && serie.ignoreHideSpecials != 1) return

          addEvent(date, {
            start: new Date(episodes[id].firstaired),
            ID_Serie: episodes[id].ID_Serie,
            serie: serie,
            episode: episodes[id]
          })
        })
        $rootScope.$applyAsync()
      },
      /**
       * Check if an event exists at the given date
       */
      hasEvent: function(date) {
        return (new Date(date).toDateString() in calendarEvents)
      },

      markDayWatched: function(day, rootScope, downloadedPaired) {
        var str = day instanceof Date ? day.toDateString() : new Date(day).toDateString()
        var now = new Date()
        if (str in calendarEvents) {
          calendarEvents[str].map(function(calEvent) {
            if (calEvent.episode.hasAired()) {
              calEvent.episode.markWatched(downloadedPaired, now, rootScope)
            }
          })
        }
      },
      markDayDownloaded: function(day, rootScope) {
        var str = day instanceof Date ? day.toDateString() : new Date(day).toDateString()
        if (str in calendarEvents) {
          calendarEvents[str].map(function(calEvent) {
            if (calEvent.episode.hasAired()) {
              calEvent.episode.markDownloaded(rootScope)
            }
          })
        }
      },
      /**
       * Return events for a date or an empty array
       */
      getEvents: function(date) {
        var str = date instanceof Date ? date.toDateString() : new Date(date).toDateString()
        return (str in calendarEvents) ? calendarEvents[str] : []
      },

      getTodoEvents: function() {
        var dates = Object.keys(calendarEvents)
        var date = new Date(dates[12])

        var y = date.getFullYear()

        var m = date.getMonth()

        var currentMonth = new Date().getMonth()
        var firstDay = new Date(y, m, 1).getTime()
        var today = currentMonth == m ? new Date().setHours(23, 59, 59, 999) : new Date(y, m + 1, 0).setHours(23, 59, 59, 999)
        var eps = []
        dates.forEach(function(day) {
          calendarEvents[day].forEach(function(event) {
            var startTime = event.start.getTime()
            if (event.serie && startTime >= firstDay && startTime < today && !event.episode.isWatched() && event.serie.displaycalendar) {
              eps.push(event)
            }
          })
        })
        return eps
      },
      /**
       * Return episode arrays grouped by local series ID, ordered by each
       * group's first event. Keep the same array between reads until the day
       * changes so Angular can reuse the grouped view.
       */
      getSeries: function(date) {
        var str = date instanceof Date ? date.toDateString() : new Date(date).toDateString()
        if (!(str in calendarEpisodeSortCache)) { // no cache yet?
          var seriesForDay = (calendarEvents[str] || []).reduce(function(grouped, event) {
            if (!(event.ID_Serie in grouped)) {
              grouped[event.ID_Serie] = []
            }
            grouped[event.ID_Serie].push(event)
            return grouped
          }, {})
          calendarEpisodeSortCache[str] = Object.keys(seriesForDay).map(function(serieId) { // turn the object into an array
            return seriesForDay[serieId]
          }).sort(function(a, b) {
            return calendarEpisodeSort(a[0], b[0]) // and sort it by the first item in it.
          })
        }
        return calendarEpisodeSortCache[str]
      }
    }

    return service
  }
])
