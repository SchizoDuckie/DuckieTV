ThePirateBay = klass({
    p720: false,
    mirror: false,
    query: "search/%s/0/7/0/",
    howmany: 1,
    initialize: function() {
        this.set720p(localStorage.getItem("search.720p") == 1);
        this.setMirror(localStorage.getItem("search.mirror"));
    },
    
    set720p: function(how) {
        this.p720 = how;
        localStorage.setItem("search.720p", how);
    },
    
    setMirror: function(to) {
        this.mirror = to;
        localStorage.setItem("search.mirror", to);
    },
    
    search: function(what, callback, howmany) {
        $.ajax({
            url: this.mirror + this.query.replace('%s', encodeURIComponent(what) + (this.p720 ? ' 720p' : '')),
            success: function(xhr, status) {
                var results = this.parseTPBResult(xhr, status, howmany);
                if (results.length > 0 && xhr.indexOf('magnet:') === -1) {
                    //$(self).text("This mirror doesn't support Magnet links. (click to find another)");
                    callback({
                        error: true,
                        results: this.tpbErrorHandler(xhr, status, what)
                    });
                } else {
                    callback({
                        error: false,
                        results: results
                    });
                }
            }.bind(this),
            error: function(xhr, status) {
                callback({
                    error: true,
                    results: this.tpbErrorHandler(xhr, status, what)
                });
            }.bind(this)
        });
    },

    /**
     * Find an alternative mirror from fucktimkuik.org. Then set that if tests are ok.
     * Finally, execute the original callback.
     */
    findAlternativeMirror: function(what, callback, howmany) {
        fuckTimKuik(function(newMirror) {
            this.mirror = newMirror;
            this.search(what, function(result) {
                if (!result.error)
                    this.setMirror(newMirror); // result is ok. store new mirror.
                callback(result);
            }.bind(this), howmany);
        }.bind(this));
    },

    /**
     * Format a TPB Searchresult and inject it into the target.
     */
    parseTPBResult: function(xhr, status, maxResults) {
        var row = $(xhr).find('#searchResult tbody tr');
        maxResults = maxResults || row.length;
        var out = [];
        if (row && row.length > 0) {
            for (var i = 0; i < maxResults; i++) {
                out.push({
                    releasename: $(row[i]).find('td:nth-child(2) > div ').text(),
                    magnetlink: $(row[i]).find('td:nth-child(2) > a')[0].outerHTML.replace(/img src=\"(.*)\/img\/icon-magnet.gif\"/igm, 'img src="static/img/icon-magnet.gif"'),
                    seeders: $(row[i]).find("td:nth-child(3)").html(),
                    leechers: $(row[i]).find("td:nth-child(4)").html()
                });
            }
        }
        return {results: out};
    },

    /**
     * Handle erros when tpb is down. with tpb mirrorsearch.
     */
    tpbErrorHandler: function(xhr, status, query) {
        console.log("ERROR!", xhr, status, query);
        return ich.showTpbError({
            mirror: this.mirror,
            status: xhr.status,
            statusText: xhr.statusText,
            query: query
        })[0].outerHTML;
    }
});

/**
 * Use Fucktimkuik.org by Geenstijl.nl to find an alternative mirror for thepiratebay.org
 */
function fuckTimKuik(cb) {
    $.ajax({
        url: 'http://www.fucktimkuik.org',
        dataType: 'html',
        success: function(xhr, a,b,c) {
            var newMirror = parseURL(xhr.match(/url=(.*[^\"])\"/i)[1]);                                     // we grep the url from the meta refresh tag.
            cb([newMirror.protocol,'://',newMirror.host, newMirror.port,'/'].join(''));
        }
    });
}