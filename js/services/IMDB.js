/** CURRENTLY UNUSED!
 * Standalone IMDB search capabilities.
 * Provides IMDB api search results
 * and the <imdb-search> tag with autocomplete.
 */

DuckieTV.provider('IMDB', function() {

    this.endpoints = {
        search: 'http://www.imdb.com/find?q=%s&s=all',
        details: 'http://www.imdb.com/title/%s'
    };

    this.getUrl = function(type, query) {
        return this.endpoints[type].replace('%s', encodeURIComponent(query));
    }

    this.parseDetails = function(result) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");
        var img = doc.querySelector('#img_primary > div > a > img');
        var rating = doc.querySelector('#overview-top > div.star-box.giga-star > div.titlePageSprite.star-box-giga-star')
        var overview = doc.querySelector('#overview-top > p:nth-child(6)');
        var output = {
            image: img ? img.src : 'img/placeholder.png',
            rating: rating ? rating.innerText : 'unknown',
            overview: overview ? overview.innerText : '',
        }
        console.log("parsed details: ", output);
        return output;
    }

    this.parseSearch = function(result) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");
        var results = doc.querySelectorAll("table.findList tr.findResult");
        var output = [];
        var max = results.length > 20 ? 20 : results.length;
        for (var i = 0; i < max; i++) {
            var link = results[i].querySelector('td:nth-child(2) a');
            if (!link) {
                continue;
            }
            var IMDB_ID = link.outerHTML.match(/(tt[0-9]+)/g);
            if (!IMDB_ID) {
                continue;
            } // weed out non-movies

            var title = link.innerText
            var parent = link.parentNode;
            parent.removeChild(link);
            var extra = parent.innerText;
            output.push({
                image: results[i].querySelector('td a img').src,
                title: title,
                IMDB_ID: IMDB_ID[0],
                extra: extra
            });
        }
        console.log("parsed: ", output);
        return output;
    }

    this.$get = ["$q", "$http",
        function($q, $http) {
            var self = this;
            return {
                findAnything: function(what) {
                    var d = $q.defer();
                    $http({
                        method: 'GET',
                        url: self.getUrl('search', what),
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
    ]
})

/**
 * Autofill serie search component
 * Provides autofill proxy and adds the selected serie back to the MainController
 */
.controller('FindIMDBTypeAheadCtrl', ["$scope", "IMDB", "WatchlistService",
    function($scope, IMDB, WatchlistService) {

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
    }
])

/**
 * <the-tv-db-search>
 */
.directive('imdbSearch', function() {

    return {
        restrict: 'E',
        template: ['<div ng-controller="FindIMDBTypeAheadCtrl">',
            '<input type="text" ng-model="selected" placeholder="{{"IMDBjs/placeholder"|translate}}"',
            'typeahead-min-length="3" typeahead-loading="loadingIMDB"',
            'typeahead="result for results in find($viewValue)  | filter: orderBy: \'title\'" typeahead-template-url="templates/typeAheadIMDB.html"',
            'typeahead-on-select="selectIMDB($item)" class="form-control"> <i ng-show="loadingIMDB" class="glyphicon glyphicon-refresh"></i>',
            '</div>'
        ].join(' ')
    };
});