DuckieTV.factory('TMDBService', ['$http', function($http) {
  const API_URL = 'https://api.themoviedb.org/3'
  const API_KEY = '79d916a2d2e91ff2714649d63f3a5cc5'
  const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/'

  // TMDB has no rate limiting and their API is generally very fast
  // this just throttles the concurrent requests to 10 at a time
  const semaphore = new Semaphore(10)

  const service = {
    /**
     * Get the image url for a given path
     * @param path the path to the image
     * @param {('w500'|'original')|string} size size of the image, defaults to w500, see https://developers.themoviedb.org/3/getting-started/images
     * @return {string|undefined}
     */
    getImageUrl: function(path, size = 'w500') {
      if (!path) {
        return
      }

      return `${TMDB_POSTER_BASE}${size}${path}`
    },
    getShow: function(tmdbId) {
      return service.makeRequest(`${API_URL}/tv/${tmdbId}?api_key=${API_KEY}&language=en-US`)
    },
    getSeason: function(tmdbId, seasonNumber) {
      return service.makeRequest(`${API_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${API_KEY}&language=en-US`)
    },
    makeRequest: async function(url) {
      try {
        await semaphore.wait()
        const response = await $http.get(url)

        if (response.status === 200) {
          return response.data
        }

        throw response
      } catch (err) {
        console.error('Error making request to TMDB', err)
        return null
      } finally {
        semaphore.release()
      }
    }
  }

  return service
}])

class Semaphore {
  constructor(initialCount) {
    this.count = initialCount
    this.waiters = []
  }

  async wait() {
    if (this.count > 0) {
      this.count--
      return
    }

    await new Promise(resolve => {
      this.waiters.push(resolve)
    })

    this.count--
  }

  release() {
    this.count++

    if (this.waiters.length > 0) {
      const next = this.waiters.shift()
      next()
    }
  }
}
