#if NW crashes without launching app
 Terminate all the nw.exe processes in task manager and then run nw with --enable-logging --v=1 under windows.
 Find the log file 'chrome_debug.log' in the user data directory.
 The log include a hardcopy ofthe chrome console log.

#enable CRUD debug logging
you can enable debug logging for CRUD activity by adding to local.storage the following:
```javascript
localStorage.setItem('CRUD.DEBUG', 'true')
```
disable debugging by setting to 'false' or deleting key
```javascript
localStorage.setItem('CRUD.DEBUG', 'false')
```
or
```javascript
localStorage.removeItem('CRUD.DEBUG')
```

#some debug calls
```javascript
localStorage.setItem('debugTSE', 'true')
```
```javascript
localStorage.removeItem('debugTSE')
```
```javascript
localStorage.setItem('debugTraktTVv2', 'true')
```
```javascript
localStorage.removeItem('debugTraktTVv2')
```
##view details of an element
```
CRUD.executeQuery('select TRAKT_ID from Episodes where ID_Episode = 36584').then(function(element) { console.log(element.rows[0]); })
```

##delete a single episode
```
CRUD.executeQuery('delete from Episodes where ID_Episode = 36584').then(function(element) { console.log("deleted."); })
```

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
    res.rows.map(function(row) {
        serieIds.push(row.ID_Serie)
    })

    CRUD.executeQuery('delete from Episodes where ID_Serie not in ('+serieIds.join(',')+') ').then(function(res) {
        console.log('done!', res.rowsAffected, 'items deleted!')
    });

});
```

##Clear seasons that were not properly deleted due to too narrow limit clause in favoritesservice.remove function
```javascript
var serieIds = [];

CRUD.executeQuery('select distinct(ID_Serie) from Series').then(function(res) {
    res.rows.map(function(row) {
        serieIds.push(row.ID_Serie)
    })

    CRUD.executeQuery('delete from Seasons where ID_Serie not in ('+serieIds.join(',')+') ').then(function(res) {
        console.log('done!', res.rowsAffected, 'items deleted!')
    });

});
```

##Completely nuke the database and settings

```javascript
CRUD.executeQuery('drop table Episodes');
CRUD.executeQuery('drop table Series');
CRUD.executeQuery('drop table Seasons');
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

## removing the snrt tables to force a reload from GitHub

```javascript
localStorage.removeItem('snrt.name-exceptions')
localStorage.removeItem('snrt.date-exceptions')
localStorage.removeItem('snrt.lastFetched')
localStorage.removeItem('snrt.traktid-tvdbid-xref')
```

## update an episode record
```javascript
CRUD.executeQuery("update episodes set absolute = 1053 where episodenumber == 1053 and seasonnumber == 21").then(function(result) { console.log(result); })
```
