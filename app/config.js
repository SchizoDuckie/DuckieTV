/**
 * Settings & functions shared between popup.html and options.html
 */
var defaultSettings = {
    "search.mirror" : "http://www.pirateshit.com/",
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

/**
 * Abuse the A element to parse a url.
 */
function parseURL(url) {
    var a =  document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':',''),
        host: a.hostname,
        port: a.port
    };
}

/**
 * Return a short string implementation of the date
 */
Date.prototype.toStr = function() {
    return [this.getFullYear(), this.getMonth()+1, this.getDate()].join('-');
};

/**
 * move to yesterday
 */
Date.prototype.yesterday = function() {
    this.setDate(this.getDate() -1);
    return this;
};

/**
 * Move to the start of a day.
 */
Date.prototype.toStart = function() {
    return new Date(this.getFullYear(), this.getMonth(), this.getDate());
};