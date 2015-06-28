#some debug calls

##Reset all watchedAt values
```javascript
CRUD.Find('Episode', {}, {'limit': 100000}).then(function(elements) {
    elements.map(function(el) {
        el.set('watched', 0);
        el.set('watchedAt', null);
        el.Persist().then(
            function() {
                console.log('saved!');
        })
    })
})
```

##Clear all series and episodes (empty database)

```javascript
CRUD.Find('Episode', {}, {'limit': 100000}).then(function(elements) {
    elements.map(function(el) {
        el.Delete().then(
            function() {
                console.log('Deleted Episode!');
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
```

##Clear episodes that were not properly deleted due to too narrow limit clause in favoritesservice.remove function
```javascript
var serieIds = [];

CRUD.executeQuery('select distinct(ID_Serie) from Series').then(function(res) {
    while(r = res.next()) {
        serieIds.push(r.row.ID_Serie)
    }

    CRUD.executeQuery('delete from Episodes where ID_Serie not in ('+serieIds.join(',')+') ').then(function(res) {
        console.log('done!', res.rs.rowsAffected, 'items deleted!')
    });

});
```

##Completely nuke the database and settings

```javascript
CRUD.executeQuery('drop table Episodes');
CRUD.executeQuery('drop table Series');
CRUD.executeQuery('drop table Seasons');
CRUD.executeQuery('drop table WatchList');
CRUD.executeQuery('drop table WatchListObject');
localStorage.clear();
```

## testing latest update mechanism

```javascript
localStorage.setItem('trakttv.lastupdated', new Date('2015-01-15').getTime())
CRUD.executeQuery("update series set lastupdated = '2015-01-05'").then(function(result) { console.log(result); })
// or even 
// CRUD.executeQuery("delete from episodes where 1").then(function(result) { console.log(result); })
// reload page
```
## mark as downloaded all episodes that have been watched.

```javascript
CRUD.executeQuery("update episodes set downloaded = 1 where watched == 1").then(function(result) { console.log(result); })
```
