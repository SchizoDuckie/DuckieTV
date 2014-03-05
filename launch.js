chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({'url': chrome.extension.getURL('tab.html')}, function(tab) {
    // Tab opened.
  });
});