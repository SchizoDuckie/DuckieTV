
angular.module('SeriesGuide.mirrorresolver', [])

.provider('MirrorResolver', function() {

 this.endpoints = {
 	thepiratebay: 'http://fucktimkuik.org/',
  };
  this.rootScope = false;
 
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
 this.$get = function($q, $http, $rootScope) {
    var self = this;
    var maxAttempts = 3;
    return {
    	/**
    	 * Execute a generic Kickass search, parse the results and return them as an array
    	 */
	    findTPBMirror: function(attempt) {
	    	attempt = attempt || 1;
	    	$rootScope.$broadcast('mirrorresolver:status', 'Finding a random TPB Mirror, attempt '+attempt);
	    	var d = $q.defer();
	        $http({
	        	method: 'GET',
	            url: self.getUrl('thepiratebay'),
	            cache: false
	        }).then(function(response) {
	        	var location = self.parseFuckTimKuik(response);
	        	$rootScope.$broadcast('mirrorresolver:status', "Found ThePirateBay mirror! " + location + " Verifying if it uses magnet links.");
	        	self.$get($q, $http, $rootScope).verifyMirror(location).then(function() {
	        		d.resolve(location);
	        	}, function(err) {
	        		if(attempt < maxAttempts) {
	        			if(err.status)
		        		$rootScope.$broadcast('mirrorresolver:status', "Mirror does not do magnet links.. trying another one.");
		        		d.resolve(self.$get($q,$http, $rootScope).findTPBMirror(attempt + 1));	        			
	        		} else {
	        			$rootScope.$broadcast("mirrorresolver:status", "Could not resolve a working mirror in "+maxAttempts +" tries. TPB is probably down.");
	        			d.reject("Could not resolve a working mirror in "+maxAttempts +" tries. TPB is probably down.");
	        		}
	        	});
	          
			}, function(err) {
				console.log('error!');
			  d.reject(err);
			});
			return d.promise;
	    },
	    verifyMirror: function(location, maxTries) {
	    	if(maxTries) { maxAttempts = tries; }
	    	$rootScope.$broadcast('mirrorresolver:status', "Verifying if mirror is using magnet links!: "+ location);
	    	var d = $q.defer();
	        
	    	testLocation = location+ "/search/test/0/7/0";
	    	 $http({
	        	method: 'GET',
	            url: testLocation
	        }).then(function(response) {
	        	$rootScope.$broadcast('mirrorresolver:status', "Results received, parsing");
	        	if(self.parseTestSearch(response)) {
	        		$rootScope.$broadcast('mirrorresolver:status', "Yes it does!");
	        		d.resolve(location);
	        	} else {
	        		$rootScope.$broadcast('mirrorresolver:status', "This is a mirror that intercepts magnet links. bypassing.");
	        		d.reject(location);
	        	}
			}, function(err) {
				$rootScope.$broadcast('mirrorresolver:status', 'error! HTTP Status: ' + angular.toJson(err.status));
			   d.reject(err);
			});
			return d.promise;


	    }
    }
  }
});