var Gui = klass({
    
    initialize: function() {
        // attach shared events.
        $(document.body).on("click", ".result a", this.launchMagnetLink);
    },

    /**
     * Attaches events only used in popup.html.
     */
    attachEvents: function() {
         $(document.body).on('click', '.goback', function() {
            window.location.hash = '#favorites';
            return false;
        });
        
        $('form#seriesearch').on('submit', this.findSerie);
        $('#searchresult').on('click', 'button.getschedule', this.selectShow);
        $('#favorites').on('click', 'li', this.selectShow);
        
        $(document.body).on('click', 'div[data-name] table td:last-child>img[alt="Magnet link"]', this.findTpbSerie);
        $(document.body).on('click', 'button.mirrorsearch', this.tpbMirrorSearch);
        $('form#tpbsearch').on('submit', this.findGeneric);
    },

    /**
     * Create a background tab to a magnet link, close it after one second.
     */
    launchMagnetLink: function(e) {
      
        chrome.tabs.create({'url': this.href,active: false}, function(tab) {
            setTimeout(function() {
                chrome.tabs.remove(tab.id);
            }, 1000);
        });
        window.faves.setDownloaded($(this).closest("div[data-id]").attr("data-id"), $(this).closest("tr.result").prev("tr[data-episode]").attr("data-episode"));
        return false;
    },

    /**
     * DO a TPB search on a mirror. Inserts a row after the current if it's not there yet.
     */
    findTpbSerie: function(e) {
        var self = $(e.target);
        
        var what = $(this).closest('div[data-name]').attr('data-name');
        var ep = self.closest('tr').attr('data-episode');
        var target = $(self.closest('tr')[0]).next();
        if (!$(target[0]).hasClass('result')) {
            $(self.closest("tr")[0]).after("<tr class='result'><th colspan='4'>Searching...</th></tr>");
            target = self.closest("tr").next('tr.result');
        }
        else {
            $(target).empty().append("<th colspan='4'>Searching...</th>");
        }
        window.thePirateBay.search(what + ' ' + ep, function(res) {
            res.results.ep = ep;
            res.results.what = what;
            console.log("Show tpb results: ", res);
            
            target = $(target).hasClass("result") ? target.empty() : target.after('<tr class="result"></tr>');
            res = (!res.error) ? ich.showTpbResults(res.results)[0].outerHTML : res.results;
            $(target).html('<td colspan="4">' + res + '</td>');
        }, 1);
    },

    /**
     * Request an alternative mirror of one is down.
     */
    tpbMirrorSearch: function(e) {
        var query = $(this).attr('data-query');
        var target = $(this).closest("tr.result");
        $(this).text("Finding an alternative TPB mirror...");
        window.thePirateBay.findAlternativeMirror(query, function(res) {
            target = $(target).hasClass("result") ? target.empty() : target.after('<tr class="result"></tr>');
            res = (!res.error) ? ich.showTpbResults(res.results)[0].outerHTML : res.results;
            $(target).html('<td colspan="4">' + res + '</td>');
        }, 1);
    },

    /**
     * Do a generic TPB search on a mirror.
     */
    findGeneric: function(e) {
        var what = $('input[type=search][name=tpb]').val();
        
        $("#searching").css("display", "block");
        $("#searchresult").empty();
        window.location.hash = 'searching';
        $("#searchresult").empty();
        window.thePirateBay.search(what, function(res) {
            res = (!res.error) ? ich.showTpbResults(res.results)[0].outerHTML : res.results;
            $('#searchresult').html("<li><table class='shows'><tr><td>" + res + '</td></tr></table></li>');
        });
        return false;
    },
    
    findSerie: function(e) {
        window.location.hash = 'searching';
        var name = $('input[type=search][name=series]').val();
        $("#searching").css("display", "block");
        $("#searchresult").empty().html("<p>Please wait. Searching...</p>");
        window.tvDB.findSeries(name, function(results) {
            $("#searchresult").empty().append(ich.showSearchResult(results));
        });
        return false;
    },
    
    selectShow: function(e) {
        
        var id = $(this).attr('data-id');
        window.location.hash = '#show_' + id;
        var schedule = $("div[data-id='" + id + "'] table.shows");
        schedule.empty();
        window.scrollTo(0, 1);
        window.tvDB.findEpisodes(id, function(epis) {
            var curDate = new Date().getTime();
            for (var i = 0; i < epis.episodes.length; i++) { // either read from cache or fresh. Parse magnet links here.
                epis.episodes[i].magnet = epis.episodes[i].firstaired === '' || Date.parse(epis.episodes[i].firstaired) >= curDate ? false : true;
                epis.episodes[i].downloaded = window.faves.getDownloaded(id, 'S' + epis.episodes[i].season + 'E' + epis.episodes[i].episode);
            }
            schedule.append(ich.showEpisodes(epis));
        });
    },
    
    notifyUpdates: function(today) {
        console.log("notify!", today, window.faves.today);
        var amount = window.faves.today.length;
        if(amount > 0) {
            amount = amount.toString();
            localStorage.setItem("today", JSON.stringify(window.faves.today));
            chrome.browserAction.setBadgeText({text: amount});
            chrome.browserAction.setBadgeBackgroundColor({color: "#000000"});
            var notification = webkitNotifications.createHTMLNotification('notification.html');
            notification.show();
            setTimeout(function() {
                notification.cancel();
            }, 35000);
        } else {
            localStorage.removeItem("today");
        }
    }
});