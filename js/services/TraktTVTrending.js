DuckieTV.factory('TraktTVTrending', ['TraktTVv2', 'FavoritesService', '$q',
    function(TraktTVv2, FavoritesService, $q) {
        var self = this;
        this.trending = [];
        this.categories = [];
        this.initializing = true;

        /*
         * enables excluding series already in favourites from trending results
         */
        var alreadyAddedSerieFilter = function(serie) {
            return this.favoriteIDs.indexOf(serie.tvdb_id.toString()) === -1;
        }.bind(FavoritesService);

        var service = {
            getAll: function() {
                if (self.initializing) {
                    return TraktTVv2.trending().then(function(series) {
                        if (!series) {
                            series = [];
                        }
                        self.trending = series;
                        var cats = {};
                        series.filter(alreadyAddedSerieFilter).map(function(serie) {
                            if (!serie.genres) return;
                            serie.genres.map(function(category) {
                                cats[category] = true;
                            });
                        });
                        self.categories = Object.keys(cats);
                        return series;
                    });
                } else {
                    return $q(function(resolve) {
                        resolve(self.trending);
                    });
                }
            },

            getById: function(tvdb_id) {
                return self.trending.filter(function(el) {
                    return el.tvdb_id == tvdb_id;
                })[0];
            },

            getByTraktId: function(trakt_id) {
                return self.trending.filter(function(el) {
                    return el.trakt_id == trakt_id;
                })[0];
            },

            getCategories: function() {
                return self.categories;
            },

            getByCategory: function(category) {
                var filtered = self.trending.filter(function(show) {
                    if (!show.genres) return;
                    return show.genres.indexOf(category) > -1;
                });
                return filtered;
            }
        };

        service.getAll().then(function() {
            self.initializing = false;
        });

        return service;
    }
]);
