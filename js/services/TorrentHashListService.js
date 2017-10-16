/**
 * A service that stores a list of all known torrents and their downloaded state in localStorage.
 * Used to detect when a torrent has been removed and can be flushed from the database, and to not
 * have to execute queries for shows that have already been marked as watched in the database.
 */
DuckieTV.factory('TorrentHashListService', [

    function() {

        function persist() {
            localStorage.setItem(['torrenting.hashList'], JSON.stringify(service.hashList));
        }

        // clean up old array format.
        if ('torrenting.hashList' in localStorage) {
            if (JSON.parse(localStorage.getItem('torrenting.hashList')).constructor === Array) {
                localStorage.removeItem('torrenting.hashList');
            }
        }
        var service = {
            /**
             *  a list of torrent magnet hashes which are being managed by DuckieTV
             */
            hashList: JSON.parse(localStorage.getItem(['torrenting.hashList'])) || {},
            /**
             * only add to list if we don't already have it, store for persistence.
             */
            addToHashList: function(torrentHash) {
                if (window.debug982) console.debug('TorrentHashListService.addToHashList(%s)', torrentHash);
                if (!service.hasHash(torrentHash)) {
                    service.hashList[torrentHash] = false;
                    persist();
                }
                return true;
            },
            /**
             * used by the remove torrent feature (uTorrent and BaseTorrentClient)
             */
            removeFromHashList: function(torrentHash) {
                if (window.debug982) console.debug('TorrentHashListService.removeFromHashList(%s)', torrentHash);
                if (service.hasHash(torrentHash)) {
                    delete service.hashList[torrentHash];
                    persist();
                }
                return true;
            },
            /**
             * Default state of a torrent in the hashlist is false, when it's downloaded it flips to true
             */
            markDownloaded: function(torrentHash) {
                if (window.debug982) console.debug('TorrentHashListService.markDownloaded(%s)', torrentHash);
                service.hashList[torrentHash] = true;
                persist();
            },
            /**
             *
             */
            isDownloaded: function(torrentHash) {
                return ((torrentHash in service.hashList) && service.hashList[torrentHash] === true);
            },
            /**
             * returns true if torrentHash is in the list, false if not found
             */
            hasHash: function(torrentHash) {
                return (torrentHash in service.hashList);
            }
        };
        return service;
    }
]);