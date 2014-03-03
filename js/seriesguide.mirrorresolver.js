
angular.module('SeriesGuide.mirrorresolver', [])

.provider('MirrorResolver', function() {

 this.endpoints = {
 	thepiratebay: 'http://fucktimkuik.org/',
};
 
 /**
  * Switch between search and details
  */
 this.getUrl = function(type) {
 		return this.endpoints[type];
 },

 this.parseFuckTimKuik = function(result) {
 	var parser = new DOMParser();
	var doc = parser.parseFromString(result.data, "text/html");
 	var result = doc.querySelector("meta[http-equiv=refresh]").content.split('url=')[1];
 	return result;
 }

 this.parseTestSearch = function(result) {
 	var parser = new DOMParser();
	var doc = parser.parseFromString(result.data, "text/html");
 	var result = doc.querySelector("#searchResult > tbody > tr:nth-child(1) > td:nth-child(2) > a:nth-child(2)");
 	return result && result.href && result.href.indexOf('magnet') == 0;
 }

 /**
  * Get wrapper, providing the actual search functions and result parser
  * Provides promises so it can be used in typeahead as well as in the rest of the app
  */
 this.$get = function($q, $http) {
    var self = this;
    return {
    	/**
    	 * Execute a generic Kickass search, parse the results and return them as an array
    	 */
	    findTPBMirror: function() {
	    	var d = $q.defer();
	        $http({
	        	method: 'GET',
	            url: self.getUrl('thepiratebay'),
	            cache: false
	        }).then(function(response) {
	        	var location = self.parseFuckTimKuik(response);
	        	console.log("Found ThePirateBay mirror!", location, " Verifying if it uses magnet links.");
	        	self.$get($q, $http).verifyMirror(location).then(function() {
	        		d.resolve(location);
	        	}, function(mirror) {
	        		console.log("Mirror does not do magnet links.. trying another one.");
	        		d.resolve(self.$get($q,$http).findTPBMirror());
	        	});
	          
			}, function(err) {
				console.log('error!');
			  d.reject(err);
			});
			return d.promise;
	    },
	    verifyMirror: function(location) {
	    	console.log("Verifying if mirror is using magnet links!", location);
	    	var d = $q.defer();
	        
	    	testLocation = location+ "/search/test/0/7/0";
	    	 $http({
	        	method: 'GET',
	            url: testLocation
	        }).then(function(response) {
	        	if(self.parseTestSearch(response)) {
	        		console.log("Yes it does!");
	        		d.resolve(location);
	        	} else {
	        		console.log("mirror that intercepts magnet links. bypassing.");
	        		d.reject(location);
	        	}
			}, function(err) {
				console.log('error!');
			   d.reject(err);
			});
			return d.promise;


	    }
    }
  }
});