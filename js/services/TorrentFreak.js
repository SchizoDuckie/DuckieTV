angular.module('DuckieTV.providers.torrentfreak', [])
/**
 * Todo: make this a proper RSS directive.
 */
.controller('Top10Pirated', function($scope, $compile, TorrentFreak) {

    $scope.activeItem;
    $scope.items = [];
    $scope.itemIndex = 0;
    $scope.activeItem = [];

    /** 
     * Switch to the previous item in the Top10 RSS feed while the index isn't maxxed out
     */
    $scope.prevItem = function() {
        if ($scope.itemIndex < $scope.items.length - 2) {
            $scope.itemIndex += 1;
        }
        $scope.activeItem = $scope.items[$scope.itemIndex];
    }
    /** 
     * Switch to the next item in the Top10 RSS feed results while the index is > 0
     */
    $scope.nextItem = function() {
        if ($scope.itemIndex > 1) {
            $scope.itemIndex -= 1;
        }
        $scope.activeItem = $scope.items[$scope.itemIndex];
    }

    /** 
     * Fetch the Top10 RSS feed, render the first item as HTML and put it on the scope.
     */
    TorrentFreak.Top10($scope).then(function(result) {
        $scope.items = result;
        $scope.activeItem = result[0];
        $compile(result[0].content)($scope);
    });
})

/**
 * TorrentFreak Top 10 Most Pirated Movies
 */
.provider('TorrentFreak', function() {

    this.endpoints = {
        top10rss: 'http://torrentfreak.com/category/dvdrip/feed/'
    };

    /**
     * Switch between search and details
     */
    this.getUrl = function(type, param) {
        return this.endpoints[type].replace('%s', encodeURIComponent(param));
    },

    /** 
     * Transform the RSS feed to a JSON structure by parsing it into a DOM document
     * and executing query selectors on it.
     */
    this.parseRSS = function(result, $compile, scope) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result, "text/xml");
        var results = doc.querySelectorAll("item");
        var output = [];
        for (var i = 0; i < results.length; i++) {
            results[i] = angular.element(results[i]);
            var out = {
                'title': results[i].getElementsByTagName('title')[0].textContent,
                'link': results[i].getElementsByTagName('link')[0].textContent,
                'comments': results[i].getElementsByTagName('comments')[0].textContent,
                'pubDate': results[i].getElementsByTagName('pubDate')[0].textContent,
                'creator': results[i].getElementsByTagName('creator')[0].textContent,
                'category': results[i].getElementsByTagName('category')[0].textContent,
                'description': results[i].getElementsByTagName('description')[0].textContent,
                'content': results[i].getElementsByTagName('encoded')[0].textContent,
                'wfw': results[i].getElementsByTagName('commentRss')[0].textContent,
                'slash': results[i].getElementsByTagName('comments')[0].textContent
            };
            var top10 = [];
            var cols = [];
            var table;
            // Precompile the content snippet into an HTML table to be able to parse that.
            // The TorrentFreak Top10 RSS feed is always in a specific table format.
            var compiled = $compile(out.content)(scope);
            for (var j = 0; j < compiled.length; j++) {
                if (compiled[j].tagName == 'TABLE') {
                    table = compiled[j];
                }
            }

            var headers = table.querySelectorAll('th');
            for (j = 0; j < headers.length; j++) {
                cols.push(headers[j].innerText);
            }
            var rows = table.querySelectorAll('tbody tr');

            for (var k = 0; k < rows.length; k++) {
                var rowItems = rows[k].querySelectorAll('td');
                if (rowItems.length < 3) continue;
                var row = {
                    rank: rowItems[0].innerText,
                    prevRank: rowItems[1].innerText.replace('(', '').replace(')', ''),
                    title: rowItems[2].querySelector('a').innerText,
                    rottenTomatoes: rowItems[2].querySelector('a').href,
                    rating: rowItems[3].querySelectorAll('a')[0].innerText,
                    imdb: rowItems[3].querySelectorAll('a')[0].href,
                    trailer: (rowItems[3].querySelectorAll('a').length == 2 ? rowItems[3].querySelectorAll('a')[1].href : false),
                };
                top10.push(row);
            }
            out.top10 = top10;
            output.push(out);
        }
        return output;
    }

    /**
     * Get wrapper, providing the actual search functions and result parser
     * Provides promises so it can be used in typeahead as well as in the rest of the app
     */
    this.$get = function($q, $http, $compile) {
        var self = this;
        return {
            /**
             * Fetch details for a specific Kickass torrent id
             */
            Top10: function(scope) {
                var d = $q.defer();
                $http({
                    method: 'GET',
                    url: self.getUrl('top10rss', null),
                    cache: true
                }).success(function(response) {
                    d.resolve(self.parseRSS(response, $compile, scope));
                }).error(function(err) {
                    d.reject(err);
                });
                return d.promise;
            }
        }
    }
})
    .directive('top10PiratedMovies', function() {

        return {
            restrict: 'E',
            templateUrl: 'templates/torrentfreakTop10.html'
        };
    })
