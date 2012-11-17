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
    $(document.body).on('click', 'div[data-name] table img[alt="Magnet link"]', FindTPB);
    $(document.body).on('click', 'button.mirrorsearch', tpbMirrorSearch);
    $(document.body).on('click', '.goback', function () {
        window.location.hash = '#favorites';
        return false;
    });
    $(document.body).on("click", "a", function (e) {
        chrome.tabs.create({'url':this.href }, function (tab) {
            setTimeout(function () {
                chrome.tabs.remove(tab.id);
            }, 5000);
        });
        e.preventDefault();
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
            console.log("Got schedule for show!", xhr, status);
            var epis = $(xhr).find("Episode");
            var schedule = $("div[data-id='" + id + "'] table.shows");
            schedule.empty();

            for (i = epis.length - 1; i > 0; i--) {
                var sn = $(epis[i]).find("SeasonNumber").text();
                var en = $(epis[i]).find("EpisodeNumber").text();
                if (sn.length == 1) sn = "0" + sn;
                if (en.length == 1) en = "0" + en;
                schedule.append([
                    '<tr data-episode="S', sn, 'E', en, '"><td>S', sn, 'E', en, "</td>",
                        '<td>', $(epis[i]).find("EpisodeName").text(), '</td>',
                        '<td>', $(epis[i]).find("FirstAired").text(), '</td>',
                        ($(epis[i]).find("FirstAired").text() === '' || Date.parse($(epis[i]).find("FirstAired").text()) > curDate) ? '<td>&nbsp;</td>' : '<td><img src="/static/img/icon-magnet.gif" width="12" height="12" alt="Magnet link"></td>',
                    '</tr>'].join(''));
            }
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

function showFavorites() {
    var favEl = $("#favorites ul").empty();
    window.location.hash = '#favorites';
    var faves = localStorage.getItem("favorites");
    if (faves) {
        faves = JSON.parse(faves);
        for (i = 0; i < faves.length; i++) {
			var escaped = escapeName(faves[i].name);
            favEl.append(["<li data-id='", faves[i].id, "' data-name='", escaped, "' style='background-image:url(", faves[i].banner, ")'>",
                              "<strong>", faves[i].name,
                                  "<span id='nextepisode'>Next Episode: <em></em></span>",
                                  "<span id='nextairdate'>Next Airdate: <em></em></span>",
                              "</strong>",
                          "</li>"].join(''));
            $(document.body).append(["<div id='show_", faves[i].id, "' data-id='", faves[i].id, "' data-name='", escaped, "'>",
                                         "<img src='", faves[i].banner, "'/>",
                                         "<input type='button' class='goback' value='back'> <input type='button' class='removefromfaves' value='Remove from favorites'>",
                                         "<p>", faves[i].overview, "</p>",
                                         "<strong>", faves[i].name,
                                             "<span id='nextepisode'>Next Episode: <em></em></span>",
                                             "<span id='nextairdate'>Next Airdate: <em></em></span>",
                                         "</strong>",
                                         
                                         "<div class='overflower'>",
                                             "<table class='shows'></table>",
                                         "</div><input type='button' class='goback' value='back'> <input type='button' class='removefromfaves' value='Remove from favorites'>",
                                     "</div>"].join(''));
        }
        $("#favorites").css("display", "block");
    }
}

function findSeries(e) {
    var name = $('input[type=search][name=series]').val();
    console.log("Finding!", name);
    $.ajax({
            url: 'http://thetvdb.com/api/GetSeries.php?seriesname=' + encodeURIComponent(name),
            dataType:'xml',
            complete:function (xhr, status) {
                window.location.hash = 'searching';
                console.log("Found it! ", xhr, status);
                var series = $(xhr.responseXML).find("Series");
                console.log(series);
                $("#searching").css("display", "block");
                $("#searchresult").empty();
                for (i = 0; i < series.length; i++) {
                    var banner = $(series[i]).find("banner").text();
                    var escaped = escapeName($(series[i]).find("SeriesName").text());
                    $("#searchresult").append([
						"<li data-id='", $(series[i]).find("id").text(), "' data-name='", escaped, "'>",
                            banner !== '' ? "<img src='http://thetvdb.com/banners/" + banner + "'>" : "",
                            "<h5>", $(series[i]).find("SeriesName").text(), "</h5>",
                            "<p>", $(series[i]).find("Overview").text(), "</p>",
                            "<button class='addtofavorites'>+ Add to favorites</button>",
                            "<table class='shows'></table>",
                        "</li>"].join("")
                    );
                }
            },
            error: function (e,f) {
                console.log("FInd error!", e,f);
            }
        });
    return false;
}

function findGeneric(e) {
    var name = $('input[type=search][name=tpb]').val();
    console.log("Finding!", name);

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

function FindTPB() {
    var what = $(this).closest('div[data-name]').attr('data-name');
    var ep = $(this).closest('tr').attr('data-episode');
    var self = this;
    var p720 = localStorage.getItem("search.720p") === "1" ? "+720p" : "";
    var query = "search/" + encodeURIComponent(what) + '+' + ep + p720 + "/0/7/0/";
    var mirror = localStorage.getItem("search.mirror");
    var targetrow = $(self).closest('tr');
    if(targetrow.next('tr.result')) {
        targetrow.next('tr.result').remove();
    }
    targetrow.after("<tr class='result'><td colspan='4'></td></tr>");
    $.ajax({
        url: mirror+query,
        success: function(xhr,status) {
            showTpbResult(xhr,status, targetrow.next('tr.result td'), 1);
        },
        error: function(xhr,status) {
            tpbErrorHandler(xhr,status,mirror, query,targetrow.next('tr.result td'));
        }
    });
}

/**
 * Format a TPB Searchresult and inject it into the target.
 */
function showTpbResult(xhr, status, target, maxResults) {

    var row = $(xhr).find('#searchResult tbody tr');
    maxResults = maxResults || row.length;
    if(row) {
        console.log(row, xhr);
        for(i=0; i<maxResults;i++) {
            target.append(["<table style='border: 1px solid black; width: 100%; border-collapse: collapse;'>",
                                "<tr>",
                                    "<td>", $(row[i]).find('td:nth-child(2) > div ').text(), "</td>", /* releasename */
                                    "<td>", $(row[i]).find('td:nth-child(2) > a')[0].outerHTML, "</td>", /*magnet */
                                    "<td>", $(row[i]).find("td:nth-child(3)").html(), "</td>", /* seeders */
                                    "<td>", $(row[i]).find("td:nth-child(4)").html(), "</td>", /* leechers */
                                "</tr>",
                            "</table>"].join(''));
        }
    } else {
        target.append(["<strong>No torrents found (yet) for ", decodeURIComponent(what + ep + p720),"</strong>"].join(''));
    }
}

/**
 * Handle erros when tpb is down. with tpb mirrorsearch.
 */
function tpbErrorHandler(xhr, status, mirror, query, targetrow) {
    console.log("ERROR!", xhr, status, query);
    var s = ['<table class="shows">',
                '<tr><th>ThePirateBay Mirror is down!</td></tr>',
                '<tr><td align="center">',mirror, ' (',xhr.status,') ', xhr.statusText, '</td></tr>',
                '<tr><td align="center"><button class="mirrorsearch" data-query="'+query+'">Retry on another ThePirateBay mirror</button></td></tr>',
            '</table>'].join('');
    if(targetrow) {
        targetrow.after(['<tr class="result">',
                            '<td colspan="4">',
                                s,
                            '</td>',
                        '</tr>'].join(''));
    } else {
        $("#searchresult").empty().append(s);
    }
    
}

/** 
 * Request an alternative mirror of one is down.
 */
function tpbMirrorSearch(e) {
    
    var query = $(this).attr('data-query');
    var targetrow = $(this).closest("tr.result > td");
    $(this).text("Finding an alternative TPB mirror...");
    var self = this;
    fuckTimKuik(function(newMirror) {
        $(self).text("Found mirror: "+ newMirror+ "Retrying search.");
        $.ajax({
            url: newMirror+query,  /* tpb search, ordered by seeds */
            success: function(xhr,status) {
                $(self).text("This mirror worked!");
                showTpbResult(xhr,status, targetrow.empty(), 1);
            },
            error: function(xhr,status) {
                $(self).text("Mirror is down :(");
                tpbErrorHandler(xhr,status,newMirror, query, targetrow);
            }
        });
    });  
}
