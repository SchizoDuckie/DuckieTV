angular.module("SeriesGuide.notifications", [])

.provider("notification", function() {
	var ids = {};

	function notification(title, text, callback) {
		var options = {
	        type: "basic",
	        title: title,
	        message: text,
	        iconUrl: "img/icon-magnet.png"
    	};
    	var id = 'seriesguide_' + new Date().getTime();
    	ids[id] = options;
   		var notification = chrome.notifications.create(id, options, callback || function() {});
	}

	this.$get = function() {
		return { notify: notification };
	};
});