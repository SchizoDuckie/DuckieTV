/**
 * The background.js service gets launched by chrome's background process when a timer is about to fire
 * It's basically a minimalist implementation of DuckieTV's favorites update mechanism.
 *
 * The way this works is simple:
 * A timer launches an event channel at a given time
 * It broadcasts a message on a channel something is listening for (for instance favorites:update, which triggers the FavoritesService)
 * After that the page gets torn down again to reduce memory footprint.
 *
 */

/** 
 * Make sure migrations don't run on the latest versions.
 */
chrome.runtime.onInstalled.addListener(function(details) {
    localStorage.setItem('runtime.event', JSON.stringify(details));
    if (details.reason == "install") {
        console.info("This is a first install!");
        localStorage.setItem('install.notify', chrome.runtime.getManifest().version);
        /*
         * example: localStorage.setItem('0.54.createtimers', 'done');
         */
    } else if (details.reason == "update") {
        var thisVersion = chrome.runtime.getManifest().version;
        console.info("Updated from " + details.previousVersion + " to " + thisVersion + "!");
        if (details.previousVersion != thisVersion) {
            localStorage.setItem('install.notify', thisVersion);
        }
    };
});