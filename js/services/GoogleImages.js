angular.module('DuckieTV.providers.googleimages', [])
/**
 * Standalone IMDB search capabilities.
 * Provides IMDB api search results
 * and the <imdb-search> tag with autocomplete.
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

    this.$get = function($q, $http) {
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
    }
})

/**
 * Autofill serie search component
 * Provides autofill proxy and adds the selected serie back to the MainController
 */
.controller('FindIMDBTypeAheadCtrl', function($scope, IMDB, WatchlistService) {

    $scope.selected = undefined;
    /**
     * Perform search and concat the interesting results when we find them.
     * Imdb api sends 3 some array keys based on exact, popular and substring results.
     * We include only the first 2 for the autocomplete.
     */
    $scope.find = function(what) {
        return IMDB.findAnything(what).then(function(res) {

            return res;
        });
    };

    /**
     * Handle imdb click.
     * @Todo figure out what to do with this. popover? new tab?
     */
    $scope.selectIMDB = function(item) {
        $scope.selected = item.title;
        console.log("IMDB Item selected!", item);
        IMDB.getDetails(item.IMDB_ID).then(function(details) {
            item.details = details;
            WatchlistService.add(item);
        }, function(err) {
            console.error(err);
            debugger;
        });
    }
})

/**
 * <the-tv-db-search>
 */
.directive('imdbSearch', function() {

    return {
        restrict: 'E',
        template: ['<div ng-controller="FindIMDBTypeAheadCtrl">',
            '<input type="text" ng-model="selected" placeholder="{{"GOOGLEIMAGESjs/placeholder"|translate}}"',
            'typeahead-min-length="3" typeahead-loading="loadingIMDB"',
            'typeahead="result for results in find($viewValue)  | filter: orderBy: \'title\'" typeahead-template-url="templates/typeAheadIMDB.html"',
            'typeahead-on-select="selectIMDB($item)" class="form-control"> <i ng-show="loadingIMDB" class="glyphicon glyphicon-refresh"></i>',
            '</div>'
        ].join(' ')
    };
});
