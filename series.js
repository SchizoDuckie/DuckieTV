document.addEventListener('DOMContentLoaded', function () {
       
    $('form#seriesearch').on('submit', findSeries);
    $('form#tpbsearch').on('submit', findGeneric);
    $('#searchresult').on('click', 'button.getschedule', selectShow);
    $('#favorites').on('click', 'li', selectShow);
    $(document.body).on('click', 'button.addtofavorites', faveShow);
    $(document.body).on('click', 'input.removefromfaves', unfaveShow);
    $(document.body).on('click', '#favorites li[data-id]', function () {
        window.location.hash = '#show_' + $(this).attr('data-id');
    });
    $(document.body).on('click', 'div[data-name] table td:last-child img[alt="Magnet link"]', FindTPB);
    $(document.body).on('click', 'button.mirrorsearch', tpbMirrorSearch);
    $(document.body).on('click', '.goback', function () {
        window.location.hash = '#favorites';
        return false;
    });
    $(document.body).on("click", "a", function (e) {
        chrome.tabs.create({'url':this.href }, function (tab) {
            setTimeout(function () {
                chrome.tabs.remove(tab.id);
            }, 2000);
        });
         return false;
    });
    showFavorites();
});

/*
 http://www.thetvdb.com/api/Updates.php?type=none
 get last update time
 */
function selectShow(e) {
    //646990DA07A98A2B
    var id = $(this).attr('data-id');
    console.log("Selected show! ", id);
    $.ajax({
        url: 'http://thetvdb.com/api/646990DA07A98A2B/series/' + id + '/all/en.xml',
        dataType:'xml',
        success:function (xhr, status) {
            var curDate = new Date().getTime();
            var epis = $(xhr).find("Episode");
            var schedule = $("div[data-id='" + id + "'] table.shows");
            schedule.empty();
            var data = [];
            for (i = epis.length - 1; i > 0; i--) {
                var sn = $(epis[i]).find("SeasonNumber").text();
                var en = $(epis[i]).find("EpisodeNumber").text();
                data.push({
                    season: (sn.length == 1) ? "0" + sn : sn,
                    episode: (en.length == 1) ? "0" + en : en,
                    episodename: $(epis[i]).find("EpisodeName").text(),
                    firstaired: $(epis[i]).find("FirstAired").text(),
                    magnet: !(($(epis[i]).find("FirstAired").text() === '' || Date.parse($(epis[i]).find("FirstAired").text()) > curDate))
                });
            }
            schedule.append(ich.showEpisodes({episodes: data}));
        }
    });
}

function faveShow(e) {
    var id = $(this).parent('li').attr('data-id');
    var name = $(this).parent('li').attr('data-name');
    console.log("Fave show!", id, name);
    var faves = localStorage.getItem("favorites") !== null ? JSON.parse(localStorage.getItem("favorites")) : [];
    faves.push({ id:id,
        name:name,
        banner:$(this).parent('li').find('img').attr("src"),
        overview:$(this).parent('li').find('p').text()
    });
    localStorage.setItem("favorites", JSON.stringify(faves));
    showFavorites();
}

function unfaveShow(e) {
    var id = $(this).parent('div[data-name]').attr('data-id');
    var name = $(this).parent('div[data-name]').attr('data-name');
    var faves = localStorage.getItem("favorites") !== null ? JSON.parse(localStorage.getItem("favorites")) : [];
    faves = faves.filter(function (obj) {
        return obj.id != id;
    });
    localStorage.setItem("favorites", JSON.stringify(faves));
    showFavorites();
}

function escapeName(input) {
	return input.replace(/\'/g, "\'");
}

function notifyUpdates(amount) {
	chrome.browserAction.setBadgeText({text: amount});
	chrome.browserAction.setBadgeBackgroundColor({color: "#000000"});
	var notification = webkitNotifications.createHTMLNotification('notification.html');
	notification.show();
}

/**
 * Grab the favorites from localstorage and display them in the main layout.
 */
function showFavorites() {
    var favEl = $("#favorites ul").empty();
    window.location.hash = '#favorites';
    var faves = localStorage.getItem("favorites");
    if (faves) {
        faves = JSON.parse(faves);
        for (var i = 0; i < faves.length; i++) {
            var data = {
                id: faves[i].id,
                name: faves[i].name,
                escaped: escapeName(faves[i].name),
                banner: faves[i].banner,
                overview: faves[i].overview
            };
            favEl.append(ich.favTpl(data));
			$(document.body).append(ich.showTpl(data));
        }
        $("#favorites").css("display", "block");
    }
}

/**
 * Do a search on thetvdb.com for series info.
 */
function findSeries(e) {
    var name = $('input[type=search][name=series]').val();
    console.log("Finding!", name);
    $.ajax({
            url: 'http://thetvdb.com/api/GetSeries.php?seriesname=' + encodeURIComponent(name),
            dataType:'xml',
            complete:function (xhr, status) {
                window.location.hash = 'searching';
                var series = $(xhr.responseXML).find("Series");
                $("#searching").css("display", "block");
                $("#searchresult").empty();
                for (i = 0; i < series.length; i++) {
                    var banner = $(series[i]).find("banner").text();
                    $("#searchresult").append(
                        ich.showSearchResult({
                            id: $(series[i]).find("id").text(),
                            escaped: escapeName($(series[i]).find("SeriesName").text()),
                            banner: banner !== '' ? "http://thetvdb.com/banners/" + banner : "",
                            name: $(series[i]).find("SeriesName").text(),
                            overview: $(series[i]).find("Overview").text()
                        })
                    );
                }
            },
            error: function (e,f) {
                console.log("FInd error!", e,f);
            }
        });
    return false;
}

/**
 * Do a generic TPB search on a mirror.
 */
function findGeneric(e) {
    var name = $('input[type=search][name=tpb]').val();
    var p720 = localStorage.getItem("search.720p") === "1" ? "+720p" : "";
    var mirror = localStorage.getItem("search.mirror");
    var query = "search/" + encodeURIComponent(name) + p720 + "/0/7/0/";
    $("#searching").css("display", "block");
    $("#searchresult").empty();
    window.location.hash = 'searching';
    $("#searchresult").empty().append('<table class="shows"><tbody><tbody></table>');
    $.ajax({
        url: mirror+query,  /* tpb search, ordered by seeds */
        success: function(xhr, status) {
            showTpbResult(xhr,status, $("#searchresult tbody"));
        },
        error: function(xhr,status) {
            tpbErrorHandler(xhr, status, query);
        }
    });
    return false;
}

/**
 * DO a TPB search on a mirror. Inserts a row after the current if it's not there yet.
 */
function FindTPB() {
    var self = $(this);
    var what = self.closest('div[data-name]').attr('data-name');
    var ep = self.closest('tr').attr('data-episode');
    var p720 = localStorage.getItem("search.720p") === "1" ? "+720p" : "";
    var query = "search/" + encodeURIComponent(what) + '+' + ep + p720 + "/0/7/0/";
    var mirror = localStorage.getItem("search.mirror");
    var targetrow = $(self.closest('tr')[0]).next();
    if(!$(targetrow[0]).hasClass('result')) {
        $(self.closest("tr")[0]).after("<tr class='result'><th colspan='4'>Searching...</th></tr>");
        targetrow = self.closest("tr").next('tr.result');
    }
    else {
        $(targetrow).empty().append("<th colspan='4'>Searching...</th>");
    }
    $.ajax({
        url: mirror+query,
        success: function(xhr,status) {
            showTpbResult(xhr,status, targetrow, 1);
        },
        error: function(xhr,status) {
            tpbErrorHandler(xhr,status,mirror, query, targetrow);
        }
    });
}

/**
 * Format a TPB Searchresult and inject it into the target.
 */
function showTpbResult(xhr, status, target, maxResults) {
    var row = $(xhr).find('#searchResult tbody tr');
    maxResults = maxResults || row.length;
    var out = [];
    if(row) {
         for(i=0; i<maxResults;i++) {
            out.push({
                releasename :  $(row[i]).find('td:nth-child(2) > div ').text(),
                magnetlink : $(row[i]).find('td:nth-child(2) > a')[0].outerHTML.replace(/img src=\"(.*)\/img\/icon-magnet.gif\"/igm, 'img src="static/img/icon-magnet.gif"'),
                seeders:  $(row[i]).find("td:nth-child(3)").html(),
                leechers: $(row[i]).find("td:nth-child(4)").html()
            });
       }
    }
    target = $(target).hasClass("result") ? target.empty() : target.after('<tr class="result"></tr>');
    var res = ich.showTpbResults( { results: out });
    $(target).html(['<td colspan="4">',res[0].outerHTML,'</td>'].join(''));
    
}

/**
 * Handle erros when tpb is down. with tpb mirrorsearch.
 */
function tpbErrorHandler(xhr, status, mirror, query, target) {
    console.log("ERROR!", xhr, status, query);
    var s = ich.showTpbError({
                                mirror: mirror,
                                status: xhr.status,
                                statusText: xhr.statusText,
                                query: query
                            });
    if(target) {
        target = target.hasClass("result") ? target.empty() : target.after('<tr class="result"></tr>');
        target.html(['<td colspan="4">', s[0].outerHTML, '</td>'].join(''));
    } else {
        $("#searchresult").empty().append(s);
    }
    
}

/**
 * Request an alternative mirror of one is down.
 */
function tpbMirrorSearch(e) {
    
    var query = $(this).attr('data-query');
    var target = $(this).closest("tr.result");
    $(this).text("Finding an alternative TPB mirror...");
    var self = this;
    fuckTimKuik(function(newMirror) {
        $(self).text("Found mirror: "+ newMirror+ " Retrying search.");
        $.ajax({
            url: newMirror+query,  /* tpb search, ordered by seeds */
            success: function(xhr,status) {
                $(self).text("This mirror worked!");
                if(xhr.indexOf('magnet:') === -1) {
                    $(self).text("This mirror doesn't support Magnet links. (click to find another)");
                    tpbErrorHandler(xhr,status,newMirror, query, target);
                } else {
                    localStorage.setItem("search.mirror", newMirror);
                    showTpbResult(xhr,status, target.empty(), 1);
                }
            },
            error: function(xhr,status) {
                $(self).text("Mirror is down :(");
                tpbErrorHandler(xhr,status,newMirror, query, target);
            }
        });
    });
}