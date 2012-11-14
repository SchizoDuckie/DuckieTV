document.addEventListener('DOMContentLoaded', function () {
    initialSetup();
    
    $('form').on('submit', findSeries);
    $('#searchresult').on('click', 'button.getschedule', selectShow);
    $('#favorites').on('click', 'li', selectShow);
    $(document.body).on('click', 'button.addtofavorites', faveShow);
    $(document.body).on('click', 'input.removefromfaves', unfaveShow);
    $(document.body).on('click', '#favorites li[data-id]', function () {
        window.location.hash = '#show_' + $(this).attr('data-id');
    });
    $(document.body).on('click', 'div[data-name] table img[alt="Magnet link"]', FindTPB);
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

function initialSetup() {
    var defaultSettings = {
        "search.720p" : "0",        // 0 || 1 ( adds 720p to every search query )
        "notify.type": "torrent",  // aired || torrent || both (aired gives notification when episode airs on tv, torrent when there's > configured seeds on tpb)
        "update.frequency" : "6"    // check every x hours for updates.
    };

    if(!localStorage.getItem('search.mirror')) { // ls settings are empty, setup.
        var keys = Object.keys(defaultSettings);
        for(var i=0; i<keys.length; i++) {
            localStorage.setItem(keys[i], defaultSettings[keys[i]]);
        }
    }
    
}

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
    var name = $('input[type=search]').val();
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

function FindTPB(e) {
    var what = $(this).closest('div[data-name]').attr('data-name');
    var ep = $(this).closest('tr').attr('data-episode');
    var self = this;
    console.log("Finding! @TPB", e.target, this, what);
    $.ajax({
        url: "http://pirateshit.com/search/" + encodeURIComponent(what) + '+' + ep + "/0/7/0/",  /* tpb search, ordered by seeds */
        complete: function (xhr, status) {
            var row = $(xhr.response).find('#searchResult tbody tr')[0];
            var targetrow = $(self).closest('tr');
            targetrow.after(["<tr>",
                                "<td colspan='4'>",
                                    "<table style='border: 1px solid black; width: 100%; border-collapse: collapse;'>",
                                        "<tr>",
                                            "<td>", $(row).find('td:nth-child(2) > div ').text(), "</td>", /* releasename */
                                            "<td>", $(row).find('td:nth-child(2) > a')[0].outerHTML, "</td>", /*magnet */
                                            "<td>", $(row).find("td:nth-child(3)").html(), "</td>", /* seeders */
                                            "<td>", $(row).find("td:nth-child(4)").html(), "</td>", /* leechers */
                                        "</tr>",
                                    "</table>",
                                "</td>",
                            "</tr>"].join(''));
        }
    });
}
