angular.module('DuckieTV.providers.tvrage', [])
    .provider('TVRage', function() {

        this.endpoints = {
            seriesSearch: 'http://services.tvrage.com/feeds/full_search.php?key=1zWislSnXYQL8WERM3c2&show=%s',
            episodeSearch: 'http://services.tvrage.com/myfeeds/episode_list.php?key=1zWislSnXYQL8WERM3c2&sid=%s'
        };

        this.getUrl = function(type, seriesname) {
            return this.endpoints[type + 'Search'].replace('%s', encodeURIComponent(seriesname));
        },

        this.parseEpisodes = function(data) {
            var curDate = new Date().getTime();
            var out = [];
            var seasons = angular.element(data).find('Season');

            for (var j = 0; j < seasons.length; j++) {
                if (!seasons[j].hasAttribute('no')) {
                    continue;
                }
                var sn = seasons[j].getAttribute("no");
                if (sn.length == 1) sn = ['0', sn].join('');

                var epis = angular.element(seasons[j]).find("episode");
                for (var i = 0; i < epis.length; i++) {
                    var episode = angular.element(epis[i]);
                    var en = episode.find("seasonnum").text();
                    if (en.length == 1) en = '0' + en.toString();
                    var airdate = episode.find("airdate").text()
                    var title = episode.find("title").text();
                    var rating = episode.find("rating").text();
                    out.push({
                        season: sn,
                        episode: en,
                        airdate: airdate,
                        title: title,
                        rating: rating
                    })
                }
            }
            return out;
        }

        this.parseSeries = function(data, name, firstaired) {

            var parseDate = function(show) {
                var aired = show.querySelector('started').innerHTML.split('/');
                if (aired && aired.length && aired.length == 3) {
                    aired[0] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(aired[0]) + 1
                }
                return new Date(aired.join('-'));
            }
            console.log("Match series on firstaired ", firstaired);

            var searchresults = [],
                found = null,
                dateMatched = false;
            var show = angular.element(typeof(data) == 'string' ? data : data.xml).find('show');

            firstaired = new Date(firstaired);
            for (var i = 0; i < show.length; i++) {
                var strippedName = name.replace(/\([12][0-s9]{3}\)/, '').trim();
                var nameMatch = show[i].querySelector('name').innerHTML == strippedName ||
                    Array.prototype.slice.call(show[i].querySelectorAll('aka')).filter(function(el) {
                        return el.innerHTML == strippedName
                    }).length > 0;
                // match shows by name, strip years.
                if (nameMatch && !dateMatched) {
                    found = show[i].querySelector('showid').innerHTML; // if there was no date match yet, use the first result
                }

                var aired = parseDate(show[i]);
                if (aired.toDateString() == firstaired.toDateString()) {
                    dateMatched = true;
                    console.log("THere's a match on ", aired, firstaired)
                    found = show[i].querySelector('showid').innerHTML;
                }
            }
            return found;
        }


        this.$get = function($q, $http) {
            var self = this;
            return {
                findSeriesID: function(name, firstaired) {
                    var d = $q.defer();
                    $http({
                        method: 'GET',
                        url: self.getUrl('series', name),
                        cache: true
                    }).then(function(response) {
                        d.resolve(self.parseSeries(response, name, firstaired));
                    }, function(err) {
                        console.log('error!');
                        d.reject(err);
                    });
                    return d.promise;
                },
                findEpisodes: function(seriesID) {
                    var d = $q.defer();
                    $http({
                        method: 'GET',
                        url: self.getUrl('episode', seriesID),
                        cache: true
                    }).success(function(response) {
                        d.resolve(self.parseEpisodes(response));
                    }).error(function(err) {
                        d.reject(err);
                    });
                    return d.promise;
                }
            }
        }
    });