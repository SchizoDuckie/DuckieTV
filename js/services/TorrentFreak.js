/**
 * TorrentFreak Top 10 Most Pirated Movies
 */
DuckieTV.provider('TorrentFreak', function() {

    var endpoints = {
        top10rss: 'https://torrentfreak.com/category/dvdrip/feed/'
    };

    /**
     * Switch between search and details
     */
    function getUrl(type, param) {
        return endpoints[type].replace('%s', encodeURIComponent(param));
    }

    /** 
     * Transform the RSS feed to a JSON structure by parsing it into a DOM document
     * and executing query selectors on it.
     */
    function parseRSS(result, $compile, scope) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result, "text/xml");
        var results = doc.querySelectorAll("item");
        var output = [];
        for (var i = 0; i < results.length; i++) {
            results[i] = angular.element(results[i]);
            var out = {
                'title': typeof(results[i].getElementsByTagName('title'))[0] != 'undefined' ? results[i].getElementsByTagName('title')[0].textContent : 'n/a',
                'link': typeof(results[i].getElementsByTagName('link'))[0] != 'undefined' ? results[i].getElementsByTagName('link')[0].textContent : 'n/a',
                'comments': typeof(results[i].getElementsByTagName('comments')[0]) != 'undefined' ? results[i].getElementsByTagName('comments')[0].textContent : 'n/a',
                'pubDate': typeof(results[i].getElementsByTagName('pubDate')[0]) != 'undefined' ? results[i].getElementsByTagName('pubDate')[0].textContent : 'n/a',
                'creator': typeof(results[i].getElementsByTagName('creator')[0]) != 'undefined' ? results[i].getElementsByTagName('creator')[0].textContent : 'n/a',
                'category': typeof(results[i].getElementsByTagName('category')[0]) != 'undefined' ? results[i].getElementsByTagName('category')[0].textContent : 'n/a',
                'description': typeof(results[i].getElementsByTagName('description')[0]) != 'undefined' ? results[i].getElementsByTagName('description')[0].textContent : 'n/a',
                'content': typeof(results[i].getElementsByTagName('encoded')[0]) == 'undefined' ? typeof(results[i].getElementsByTagName('content:encoded')[0]) != 'undefined' ? results[i].getElementsByTagName('content:encoded')[0].textContent :  'n/a' : results[i].getElementsByTagName('encoded')[0].textContent,
                'wfw': typeof(results[i].getElementsByTagName('commentRss')[0]) != 'undefined' ? results[i].getElementsByTagName('commentRss')[0].textContent : 'n/a',
                'slash': typeof(results[i].getElementsByTagName('comments')[0]) != 'undefined' ? results[i].getElementsByTagName('comments')[0].textContent : 'n/a'
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
                    title: rowItems[2].innerText,
                    searchTitle: rowItems[2].querySelector('a').innerText,
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
    this.$get = ["$q", "$http", "$compile",
        function($q, $http, $compile) {
            return {
                /**
                 * Fetch details for a specific Kickass torrent id
                 */
                Top10: function(scope) {
                    return $http({
                        method: 'GET',
                        url: getUrl('top10rss', null),
                        cache: true
                    }).then(function(response) {
                        return parseRSS(response.data, $compile, scope);
                    })
                }
            }
        }
    ]
})
.directive('top10PiratedMovies', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/torrentFreakTop10.html',
        controller: ["$compile", "TorrentFreak", "$rootScope", "$injector", "$filter",
            function($compile, TorrentFreak, $rootScope, $injector, $filter) {
                var vm = this;
                this.activeItem;
                this.items = [];
                this.itemIndex = 0;
                this.activeItem = [];

                /**
                 * Closes the SidePanel 
                 */
                this.closeSidePanel = function() {
                    $injector.get('$state').go('calendar');
                }

                /** 
                 * Switch to the previous item in the Top10 RSS feed while the index isn't maxxed out
                 */
                this.prevItem = function() {
                    if (this.itemIndex < vm.items.length - 1) {
                        this.itemIndex += 1;
                        this.activeItem = vm.items[vm.itemIndex];
                    }
                }

                /** 
                 * Switch to the next item in the Top10 RSS feed results while the index is > 0
                 */
                this.nextItem = function() {
                    if (this.itemIndex > 0) {
                        this.itemIndex -= 1;
                        this.activeItem = vm.items[vm.itemIndex];
                    }
                }
                
                this.getLocal = function(title) {
                    if (title) {
                        var titlePart = title.split('–');
                        var titleDate = new Date(moment(titlePart[1], "MM/DD/YY"));
                        return titlePart[0] + '– ' + $filter('date')(titleDate, 'shortDate');
                    } else {
                        return '';
                    }
                }

                /** 
                 * Fetch the Top10 RSS feed, render the first item as HTML and put it on the scope.
                 */
                TorrentFreak.Top10($rootScope).then(function(result) {
                    vm.items = result;
                    vm.activeItem = result[0];
                });
            }
        ],
        controllerAs: 'vm',
        bindToController: true
    };
})
