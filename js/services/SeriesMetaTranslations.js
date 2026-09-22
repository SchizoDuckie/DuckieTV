DuckieTV.factory('SeriesMetaTranslations', ['$filter', '$locale',
  function($filter, $locale) {
    var translate = $filter('translate')

    function translateSemantic(prefix, value, supported) {
      if (supported.indexOf(value) === -1) return value
      var key = prefix + '.' + value.replace(/\s+/g, '-')
      var translated = translate(key)
      return translated === key ? value : translated
    }

    var service = {
      genres: ['action', 'adventure', 'animation', 'anime', 'biography', 'children', 'comedy', 'crime', 'disaster', 'documentary', 'drama', 'eastern', 'family', 'fan-film', 'fantasy', 'film-noir', 'food', 'game-show', 'history', 'holiday', 'home-and-garden', 'horror', 'indie', 'mini-series', 'music', 'musical', 'mystery', 'news', 'none', 'reality', 'road', 'romance', 'science-fiction', 'short', 'soap', 'special-interest', 'sports', 'sporting-event', 'superhero', 'suspense', 'talk-show', 'thriller', 'travel', 'tv-movie', 'war', 'western'],
      statuses: ['canceled', 'ended', 'in production', 'returning series', 'planned'],
      daysOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

      translateGenre: function(genre) {
        return translateSemantic('GENRE', genre, service.genres)
      },

      translateStatus: function(status) {
        return translateSemantic('STATUS', status, service.statuses)
      },

      translateDayOfWeek: function(day) {
        return $locale.DATETIME_FORMATS.DAY[service.daysOfWeek.indexOf(day)]
      }
    }

    return service
  }
])
