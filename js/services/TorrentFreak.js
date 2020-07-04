/**
 * TorrentFreak Top 10 Most Pirated Movies
 */
DuckieTV.provider('TorrentFreak', function() {
  var endpoints = {
    archive: 'https://torrentfreak.com/most-pirated-movies-of-%s-weekly-archive/' // may need maintenance?
  }

  /**
   * Get and transform url
   */
  function getUrl(type, param) {
    return endpoints[type].replace('%s', encodeURIComponent(param))
  }

  /**
   * Snag all tables from the archive page, parse them and feed them to the directive.
   */
  function parseTables(result) {
    var parser = new DOMParser()
    var doc = parser.parseFromString(result.data, 'text/html')
    var tables = doc.querySelectorAll('table.css.hover');
    var output = [];
    for(var i=0; i<tables.length; i++) {
      var rows = tables[i].querySelectorAll('tbody tr'),
      out = {
        title: tables[i].previousElementSibling.textContent,
        top10: []
      };  

      for (var k = 0; k < rows.length; k++) {
        var rowItems = rows[k].querySelectorAll('td')
        if (rowItems.length < 4) continue
        // console.debug('rank: ',rowItems[0].innerText);
        // console.debug('prevRank: ',rowItems[1].innerText.replace('(', '').replace(')', ''));
        // console.debug('title: ',rowItems[2].innerText);
        // console.debug('searchTitle: ',rowItems[2].querySelectorAll('a').length > 0 ? rowItems[2].querySelector('a').innerText : 'null');
        // console.debug('rating: ',rowItems[3].querySelectorAll('a').length > 0 ? rowItems[3].querySelectorAll('a')[0].innerText : 'null');
        // console.debug('imdb: ',rowItems[3].querySelectorAll('a').length > 0 ? rowItems[3].querySelectorAll('a')[0].href : 'null');
        // console.debug('trailer: ',(rowItems[3].querySelectorAll('a').length == 2 ? rowItems[3].querySelectorAll('a')[1].href : 'null'));
        var row = {};
        try {
          row.rank = rowItems[0].innerText;
          row.prevRank = rowItems[1].innerText.replace('(', '').replace(')', '');
          row.title = rowItems[2].innerText;
          row.searchTitle = rowItems[2].querySelectorAll('a').length > 0 ? rowItems[2].querySelector('a').innerText : rowItems[2].innerText;
          row.rating = rowItems[3].querySelectorAll('a').length > 0 ? rowItems[3].querySelectorAll('a')[0].innerText : '?';
          row.imdb = rowItems[3].querySelectorAll('a').length ? rowItems[3].querySelectorAll('a')[0].href : '';
          row.trailer = rowItems[3].querySelectorAll('a').length == 2 ? rowItems[3].querySelectorAll('a')[1].href : '';
          out.top10.push(row)
        } catch(E) {
          console.log("Parse error in row. Torrentfreak changed their formatting again?", E, rowItems);
        }
      }
      output.unshift(out);
    }
    return output
  }


  this.$get = ['$http',
    function($http) {
      return {
        Archive: function() {
          return $http({
            method: 'GET',
            url: getUrl('archive', new Date().getFullYear()),
            cache: true
          })
          .then(parseTables);
        }
      };
    }
  ]
})
.directive('top10PiratedMovies', function() {
  return {
    restrict: 'E',
    templateUrl: 'templates/torrentFreakTop10.html',
    controller: ['TorrentFreak', '$injector',
      function(TorrentFreak, $injector) {
        var vm = this
        this.activeItem
        this.items = []
        this.itemIndex = 0
        this.activeItem = []

        /**
         * Closes the SidePanel
         */
        this.closeSidePanel = function() {
          $injector.get('$state').go('calendar')
        }

        /**
         * Switch to the previous item in the Top10 RSS feed while the index isn't maxxed out
         */
        this.prevItem = function() {
          if (this.itemIndex < vm.items.length - 1) {
            this.itemIndex += 1
            this.activeItem = vm.items[vm.itemIndex]
          }
        }

        /**
         * Switch to the next item in the Top10 RSS feed results while the index is > 0
         */
        this.nextItem = function() {
          if (this.itemIndex > 0) {
            this.itemIndex -= 1
            this.activeItem = vm.items[vm.itemIndex]
          }
        }

        /**
         * Fetch the Top10 RSS feed, render the first item as HTML and put it on the scope.
         */
        TorrentFreak.Archive()
          .then(function(result) {
            vm.items = result;
            vm.activeItem = result[0];
          })
      }
    ],
    controllerAs: 'vm',
    bindToController: true
  }
});