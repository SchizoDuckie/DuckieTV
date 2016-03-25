/**
 * Base object for holding Torrent Data.
 * Individual clients extend this and implement the methods to adhere to the DuckieTorrent interface.
 */
function TorrentData(data) {
    this.files = [];
    this.update(data);
}

TorrentData.prototype.getClient = function() {
    return angular.element(document.body).injector().get('DuckieTorrent').getClient();
};

/**
 * Round a number with Math.floor so that we don't lose precision on 99.7%
 */
TorrentData.prototype.round = function(x, n) {
    return Math.floor(x * Math.pow(10, n)) / Math.pow(10, n);
};

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
};

/**
 * Display name for torrent
 */
TorrentData.prototype.getName = function() {
    throw "function not implemented";
};

/**
 * Progress percentage 0-100. round to one digit to make sure that torrents are not stopped before 100%.
 */
TorrentData.prototype.getProgress = function() {
    throw "function not implemented";
};

/**
 * Send start command to the torrent client implementation for this torrent.
 */
TorrentData.prototype.start = function() {
    throw "function not implemented";
};

/**
 * Send stop command to the torrent client implementation for this torrent.
 */
TorrentData.prototype.stop = function() {
    throw "function not implemented";
};

/**
 * Send pause command to the torrent client implementation for this torrent.
 */
TorrentData.prototype.pause = function() {
    throw "function not implemented";
};

/**
 * Send remove command to the torrent client implementation for this torrent.
 */
TorrentData.prototype.remove = function() {
    throw "function not implemented";
};

/**
 * Send get files command to the torrent client implementation for this torrent.
 */
TorrentData.prototype.getFiles = function() {
    throw "function not implemented";
};

/**
 * Send isStarted query to the torrent client implementation for this torrent.
 * @returns boolean
 */
TorrentData.prototype.isStarted = function() {
    throw "function not implemented";
};

/** 
 * Get torrent download speed in B/s
 */
TorrentData.prototype.getDownloadSpeed = function() {
    throw "function not implemented";
};