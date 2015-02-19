angular.module('DuckieTV.providers.googleimages', [])

/** CURRENTLY UNUSED!
 * Standalone Google search capabilities.
 * Provides Google search results.
 */

.provider('GoogleImages', function() {

    this.endpoints = {
        searchWallpaper: 'https://www.google.nl/search?q=%s+movie+wallpaper&source=lnms&tbm=isch&sa=X&tbs=isz:lt,islt:2mp',
    };

    this.getUrl = function(type, query) {
        return this.endpoints[type].replace('%s', encodeURIComponent(query));
    }

    this.parseSearch = function(result) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");
        var output = {
            link: doc.querySelector('#rg_s > div:nth-child(2) > a').href,
            img: doc.querySelector('#rg_s > div:nth-child(2) > a img').src,
        }
        debugger;
        console.log("parsed details: ", output);
        return output;
    }

    this.$get = ["$q", "$http", function($q, $http) {
        var self = this;
        return {
            wallpaper: function(what) {
                var d = $q.defer();
                $http({
                    method: 'GET',
                    url: self.getUrl('searchWallpaper', what),
                    cache: true
                }).then(function(response) {
                    d.resolve(self.parseSearch(response));
                }, function(err) {
                    console.log('error!');
                    d.reject(err);
                });
                return d.promise;
            },
            getDetails: function(imdbid) {
                var d = $q.defer();
                $http({
                    method: 'GET',
                    url: self.getUrl('details', imdbid),
                    cache: true
                }).then(function(response) {
                    d.resolve(self.parseDetails(response));
                }, function(err) {
                    console.log('error!');
                    d.reject(err);
                });
                return d.promise;
            }
        }
    }]
})
