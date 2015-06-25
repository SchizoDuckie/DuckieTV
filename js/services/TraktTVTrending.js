DuckieTV.factory('TraktTVTrending', ['TraktTVv2', '$q',
    function(TraktTVv2, $q) {
        var self = this;
        this.trending = [];
        this.categories = [];
        this.initializing = true;

        var service = {

            getAll: function() {
                if (self.initializing) {
                    return TraktTVv2.trending().then(function(series) {
                        self.trending = series || [];
                        var cats = {};
                        series.map(function(serie) {
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

            getCategories: function() {
                return self.categories;
            },

            getByCategory: function(category) {
                var filtered = self.trending.filter(function(show) {
                    return show.genres.indexOf(category) > -1;
                });
                console.log("Filtred for ", category, filtered);
                return filtered;
            }
        };


        service.getAll().then(function() {
            self.initializing = false;
        });


        return service;
    }
]);