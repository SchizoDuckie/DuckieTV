/**
 * First off, we allow for easy prototype extension.
 * to be able to define
 */

Function.prototype.extends = function(ParentClass) {
    this.prototype = new ParentClass();
    this.prototype.constructor = this;
}

/**
 * Base object for holding Torrent Data.
 * Individual clients extend this and implement the methods to adhere to the DuckieTorrent interface.
 */
function TorrentData(data) {
    this.files = [];
    this.update(data);
};

/**
 * Round a number with Math.floor so that we don't lose precision on 99.7%
 */
TorrentData.prototype.round = function(x, n) {
    return Math.floor(x * Math.pow(10, n)) / Math.pow(10, n)
}


/** 
 * load a new batch of data into this object
 */
TorrentData.prototype.update = function(data) {
    if (!data) {
        return;
    }
    Object.keys(data).map(function(key) {
        this[key] = data[key];
    }, this);
}

/**
 * Display name for torrent
 */
TorrentData.prototype.getName = function() {
    throw "function not implemented"
};

/**
 * Progress percentage 0-100. round to one digit to make sure that torrents are not stopped before 100%.
 */
TorrentData.prototype.getProgress = function() {
    throw "function not implemented"
};

/**
 * Send start command to the torrent client implementation for this torrent.
 */
TorrentData.prototype.start = function() {
    throw "function not implemented"
};

/**
 * Send stop command to the torrent client implementation for this torrent.
 */
TorrentData.prototype.stop = function() {
    throw "function not implemented"
};

/**
 * Send pause command to the torrent client implementation for this torrent.
 */
TorrentData.prototype.pause = function() {
    throw "function not implemented"
};


/**
 * Send get files command to the torrent client implementation for this torrent.
 */
TorrentData.prototype.getFiles = function() {
    throw "function not implemented"
};

/**
 * Send isStarted query to the torrent client implementation for this torrent.
 * @returns boolean
 */
TorrentData.prototype.isStarted = function() {
    throw "function not implemented"
}



/**
 * Client implementations
 */

/**
 * qBittorrent
 * Works for both 3.2+ and below.
 */
qBittorrentData = function(data) {
    this.update(data);
};

qBittorrentData.extends(TorrentData);

qBittorrentData.prototype.getName = function() {
    return this.name;
};

qBittorrentData.prototype.getProgress = function() {
    return this.round(this.percentDone * 100, 1);
};

qBittorrentData.prototype.start = function() {
    DuckieTorrent.getClient().execute('resume', this.hash);

};

qBittorrentData.prototype.stop = function() {
    this.pause();
};

qBittorrentData.prototype.pause = function() {
    DuckieTorrent.getClient().execute('pause', this.hash);
};

qBittorrentData.prototype.getFiles = function() {
    return DuckieTorrent.getClient().getFilesList(this.hash).then(function(results) {
        this.files = results;
    }.bind(this));
};

qBittorrentData.prototype.isStarted = function() {
    return this.status > 0;
}



/**
 * Transmission
 */
TransmissionData = function(data) {
    this.update(data);
};

TransmissionData.extends(TorrentData);

TransmissionData.prototype.getName = function() {
    return this.name;
};

TransmissionData.prototype.getProgress = function() {
    return this.round(this.percentDone * 100, 1);
};

TransmissionData.prototype.start = function() {
    DuckieTorrent.getClient().execute('torrent-start', this.id);
};

TransmissionData.prototype.stop = function() {
    DuckieTorrent.getClient().execute('torrent-stop', this.id);
};
TransmissionData.prototype.pause = function() {
    this.stop();
};

TransmissionData.prototype.isStarted = function() {
    return this.status > 0;
}

/**
 * Vuze - Exact same api as Transmission.
 */
var VuzeData = function(data) {
    this.update(data);
};

VuzeData.extends(TransmissionData);


/**
 * Tixati
 */
TixatiData = function(data) {
    this.update(data);
};

TixatiData.extends(TorrentData);

TixatiData.prototype.getName = function() {
    return this.name;
};

TixatiData.prototype.getProgress = function() {
    return parseInt(this.progres);
};

TixatiData.prototype.start = function() {
    var fd = new FormData();
    fd.append('start', 'Start');
    return DuckieTorrent.getClient().execute(this.guid, fd);
};

TixatiData.prototype.stop = function() {
    var fd = new FormData();
    fd.append('stop', 'Stop');
    return DuckieTorrent.getClient().execute(this.guid, fd);
};
TixatiData.prototype.pause = function() {
    return this.stop();
};

TixatiData.prototype.isStarted = function() {
    return this.status.toLowerCase().indexOf('offline') == -1;
}

TixatiData.prototype.getFiles = function() {
    this.files = [];
    DuckieTorrent.getClient().execute('files', this.guid).then(function(data) {
        this.files = data;
    }.bind(this));
}