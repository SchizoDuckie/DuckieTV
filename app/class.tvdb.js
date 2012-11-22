/**
 * Tv DB data source.
 * Should be easily swappable for any other in the future.
 */
var tvDB = klass({
    seriesSearch: 'http://thetvdb.com/api/GetSeries.php?seriesname=%s',
    episodeSearch: 'http://thetvdb.com/api/646990DA07A98A2B/series/%s/all/en.xml',
    
    initialize: function() {
    
    },
    
    findSeries: function(name, cb) {
        $.ajax({
            url: this.seriesSearch.replace('%s', encodeURIComponent(name)),
            dataType: 'xml',
            success: function(xhr, status) {
                cb(this.parseSeries(xhr, status));
            }.bind(this)
        });
        return false;
    },
    
    findEpisodes: function(showID, cb) {
        var cached = localStorage.getItem("serie." + showID);
        
        if (!cached) {
            $.ajax({
                url: this.episodeSearch.replace('%s', showID),
                dataType: 'xml',
                success: function(xhr, status) {
                    var result = this.parseEpisodes(xhr, status);
                    if (cb) {
                        cb(result);
                    }
                    localStorage.setItem("serie." + showID, JSON.stringify({lastCached: new Date().getTime(),episodes: result.episodes}));
                }.bind(this)
            });
        }
        else {
            cached = JSON.parse(cached);
            if (cb)
                cb(cached);
        }
    },
    
    findNextEpisode: function(episodes) {
        var curDate = new Date().toStart().getTime();
        var yesterday = new Date().toStart().yesterday().getTime();
        var prevAirdate = false;
        var epi = false;
        for (var i = 0; i < episodes.length; i++) {
            if (episodes[i].firstaired !== '') {
                var airdate = new Date(Date.parse(episodes[i].firstaired)).toStart().getTime();
                
                if (!prevAirdate || (airdate < prevAirdate && (airdate == yesterday || airdate >= curDate))) {
                    prevAirdate = airdate;
                    epi = episodes[i];
                }
            }
        }
        return epi;
    },
    
    
    findTodaysEpisode: function(episodes) {
        var today = new Date().toStart().toStr();
        var yesterday = new Date().toStart().yesterday().toStr();
        var daysago = new Date().toStart().yesterday().yesterday().toStr();
        for (var i = 0; i < episodes.length; i++) {
            if (episodes[i].firstaired !== '') {
                var airdate = new Date(Date.parse(episodes[i].firstaired)).toStr();
                if (airdate === yesterday || airdate === today) {
                    return episodes[i];
                }
            }
        }
        return false;
    },
    
    parseEpisodes: function(xhr, status) {
        var curDate = new Date().getTime();
        var epis = $(xhr).find("Episode");
        var data = [];
        for (var i = epis.length - 1; i > 0; i--) {
            var sn = $(epis[i]).find("SeasonNumber").text();
            var en = $(epis[i]).find("EpisodeNumber").text();
            data.push({
                season: (sn.length == 1) ? "0" + sn : sn,
                episode: (en.length == 1) ? "0" + en : en,
                episodename: $(epis[i]).find("EpisodeName").text(),
                firstaired: $(epis[i]).find("FirstAired").text(),
                magnet: false
            });
        }
        return {episodes: data};
    },
    
    parseSeries: function(xhr, status, callback) {
        var series = $(xhr).find("Series");
        var results = [];
        for (var i = 0; i < series.length; i++) {
            var banner = $(series[i]).find("banner").text();
            results.push({
                id: $(series[i]).find("id").text(),
                escaped: $(series[i]).find("SeriesName").text().replace(/\'/g, "\'"),
                banner: banner !== '' ? "http://thetvdb.com/banners/" + banner : "",
                name: $(series[i]).find("SeriesName").text(),
                overview: $(series[i]).find("Overview").text()
            });
        }
        return ({searchresults: results});
    }
});