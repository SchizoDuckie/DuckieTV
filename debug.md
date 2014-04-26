###some debug calls

##Reset all watchedat values
`` 
CRUD.Find('Episode', {}, {'limit': 10000}).then(function(elements) { 
	elements.map(function(el) { 
		el.set('watched', 0);
	    el.set('watchedAt', null); 
	    el.Persist().then(
	    	function() { 
	    		console.log('saved!') ;
	    })
	})
})
`` 

##Clear all series and episodes (empty database)

``
CRUD.Find('Episode', {}, {'limit': 100000}).then(function(elements) { 
	elements.map(function(el) { 
		el.Delete().then(
	    	function() { 
	    		console.log('Deleted Episode!') ;
	    })
	})
});

CRUD.Find('Serie', {}, {'limit': 10000}).then(function(elements) { 
	elements.map(function(el) { 
		el.Delete().then(
	    	function() { 
	    		console.log('Deleted Serie!') ;
	    })
	})
});

CRUD.Find('Season', {}, {'limit': 10000}).then(function(elements) { 
	elements.map(function(el) { 
		el.Delete().then(
	    	function() { 
	    		console.log('Deleted Season!') ;
	    })
	})
});



`` 