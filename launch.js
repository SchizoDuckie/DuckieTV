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

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.getAllInWindow(undefined, function(tabs) {
    for (var i = 0, tab; tab = tabs[i]; i++) {
      if (tab.url.indexOf(chrome.extension.getURL('tab.html')) == 0) {
        //console.debug('Found DuckieTV Tab');
        chrome.tabs.update(tab.id, {selected: true});
        return;
      }
    }
    //console.debug('Could not find DuckieTV tab. Creating one...');
    chrome.tabs.create({url: chrome.extension.getURL('tab.html')});
  });
});