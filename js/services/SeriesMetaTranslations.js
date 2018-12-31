DuckieTV.factory('SeriesMetaTranslations', ['$filter', '$locale',
  function($filter, $locale) {
    var translatedGenres = $filter('translate')('GENRELIST').split('|')
    var translatedStatuses = $filter('translate')('STATUSLIST').split('|')

    var service = {
      genres: ['action', 'adventure', 'animation', 'anime', 'biography', 'children', 'comedy', 'crime', 'disaster', 'documentary', 'drama', 'eastern', 'family', 'fan-film', 'fantasy', 'film-noir', 'food', 'game-show', 'history', 'holiday', 'home-and-garden', 'horror', 'indie', 'mini-series', 'music', 'musical', 'mystery', 'news', 'none', 'reality', 'road', 'romance', 'science-fiction', 'short', 'soap', 'special-interest', 'sports', 'sporting-event', 'superhero', 'suspense', 'talk-show', 'thriller', 'travel', 'tv-movie', 'war', 'western'],
      statuses: ['canceled', 'ended', 'in production', 'returning series', 'planned'],
      daysOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

      translateGenre: function(genre) {
        var idx = service.genres.indexOf(genre)
        return (idx !== -1) ? translatedGenres[idx] : genre
      },

      translateStatus: function(status) {
        var idx = service.statuses.indexOf(status)
        return (idx !== -1) ? translatedStatuses[idx] : status
      },

      translateDayOfWeek: function(day) {
        return $locale.DATETIME_FORMATS.DAY[service.daysOfWeek.indexOf(day)]
      }
    }

    return service
  }
])
