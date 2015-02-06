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

CRUD.EntityManager.getAdapter().db.execute('select distinct(ID_Serie) from Series').then(function(res) {
    while(r = res.next()) {
        serieIds.push(r.row.ID_Serie)
    }

    CRUD.EntityManager.getAdapter().db.execute('delete from Episodes where ID_Serie not in ('+serieIds.join(',')+') ').then(function(res) {
        console.log('done!', res.rs.rowsAffected, 'items deleted!')
    });

});
```

##Completely nuke the database and settings

```javascript
CRUD.EntityManager.getAdapter().db.execute('drop table Episodes');
CRUD.EntityManager.getAdapter().db.execute('drop table Series');
CRUD.EntityManager.getAdapter().db.execute('drop table Seasons');
CRUD.EntityManager.getAdapter().db.execute('drop table WatchList');
CRUD.EntityManager.getAdapter().db.execute('drop table WatchListObject');
localStorage.clear();
```

## testing latest update mechanism

```javascript
localStorage.setItem('trakttv.lastupdated', new Date('2015-01-15').getTime())
CRUD.EntityManager.getAdapter().db.execute("update series set lastupdated = '2015-01-05'").then(function(result) { console.log(result); })
// or even 
// CRUD.EntityManager.getAdapter().db.execute("delete from episodes where 1").then(function(result) { console.log(result); })
// reload page
```
