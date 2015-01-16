CRUD.SQLiteAdapter = function(database, dbOptions) {
    this.databaseName = database;
    this.dbOptions = dbOptions
    this.lastQuery = false;
    this.initializing = true;
    CRUD.ConnectionAdapter.apply(this, arguments);

    this.Init = function() {
        var that = this;
        return new Promise(function(resolve, fail) {
            that.db = new CRUD.Database(that.databaseName);
            that.db.connect().then(function() {
                CRUD.log("SQLITE connection created to ", that.databaseName);
                that.verifyTables().then(function() {
                    that.initializing = false;
                    resolve()
                }, fail);
            }, fail);
        });
    };

    this.verifyTables = function() {
        CRUD.log('verifying that tables exist');
        var that = this;
        var PromiseQueue = [];

        for (var i in CRUD.EntityManager.entities) {

            PromiseQueue.push(new Promise(function(resolve, fail) {
                var entity = CRUD.EntityManager.entities[i];
                that.db.execute("SELECT count(*) as existing FROM sqlite_master WHERE type='table' AND name= ?", [entity.table]).then(function(resultSet) {
                        var res = resultSet.next().row;
                        if (res.existing === 0) {
                            CRUD.log(entity, ": Table does not exist.");
                            if (!entity.createStatement) {
                                CRUD.log("No create statement found for " + entity.className + ". Don't know how to create table.");
                                fail();
                            } else {
                                CRUD.log("Create statement found. Creating table for " + entity.className + ':' + entity.createStatement);
                                PromiseQueue.push(that.db.execute(entity.createStatement).then(function() {
                                    CRUD.log(entity.className + " table created.");
                                    if ('migrations' in entity) {
                                        localStorage.setItem('database.version.' + entity.table, Math.max.apply(Math, Object.keys(entity.migrations)));
                                    }
                                    Promise.all(that.createFixtures(entity)).then(resolve);
                                }, function(err) {
                                    CRUD.log("Error creating " + entity.className, err);
                                    fail();
                                }));
                            }
                        } else {
                            var prq = [];

                            if (entity.migrations) {
                                var currentVersion = !localStorage.getItem('database.version.' + entity.table) ? 1 : parseInt(localStorage.getItem('database.version.' + entity.table), 10);
                                if (isNaN(currentVersion)) {
                                    currentVersion = 1;
                                };
                                var highestVersion = Math.max.apply(Math, Object.keys(entity.migrations));
                                while (currentVersion != highestVersion) {
                                    currentVersion++;
                                    if (currentVersion in entity.migrations) {
                                        var migrations = entity.migrations[currentVersion];
                                        for (var i = 0; i < migrations.length; i++) {
                                            var q = migrations[i];

                                            prq.push(new Promise(function(r, f) {
                                                CRUD.log('Executing migration: ', q);
                                                that.db.execute(q).then(function(result) {
                                                    CRUD.log("Migration success!", result);
                                                    r();
                                                }, function(E) {
                                                    CRUD.log("Migration failed!", E);
                                                    f();
                                                })
                                            }));
                                        }
                                    }
                                }
                            }
                            Promise.all(prq).then(function() {
                                CRUD.log("All migrations executed!");
                                localStorage.setItem('database.version.' + entity.table, highestVersion);
                                resolve();
                            }, function(e) {
                                CRUD.log("Some migrations failed!", e);
                                fail();
                                debugger;
                            });

                        }
                    },
                    function(err) {
                        CRUD.log("Failed!", err, entity);;
                        fail();
                    });
            }));

        }

        return Promise.all(PromiseQueue);

    };

    this.createFixtures = function(entity) {
        var pq = [];
        if (entity.fixtures) {
            CRUD.log(entity.fixtures.length + ' Fixtures found for ' + entity.className + ' inserting.')
            for (var i = 0; i < entity.fixtures.length; i++) {
                pq.push(CRUD.fromCache(entity.className, entity.fixtures[i]).Persist(true, 'INSERT'));
            }
        }
        return pq;
    }

    this.delayUntilSetupDone = function(func) {
        if (!this.initializing) {
            return func();
        } else {
            setTimeout(this.delayUntilSetupDone, 500, func)
        }
    },

    this.Find = function(what, filters, sorting, justthese, options, filters) {
        var builder = new CRUD.Database.SQLBuilder(what, filters || {}, sorting || {}, justthese || {}, options || {});
        var query = builder.buildQuery();
        var opt = options;
        this.lastQuery = query;
        var that = this;

        CRUD.log("Executing query via sqliteadapter: ", options, query);
        return new Promise(function(resolve, fail) {
            return that.delayUntilSetupDone(function() {
                that.db.execute(query.query, query.parameters).then(function(resultset) {
                    var row, output = [];
                    while (row = resultset.next()) {
                        var obj = new window[what]().importValues(row.row);
                        output.push(obj);
                    }
                    resolve(output);
                }, function(resultSet, sqlError) {
                    CRUD.log('SQL Error in FIND : ', sqlError, resultSet, what, this, query, [sql.split(' VALUES (')[0], (s = JSON.stringify(valueBindings)).substr(1, s.length - 2)].join(' VALUES (') + ')');
                    debugger;
                    fail();
                });
            });
        });
    },

    this.Persist = function(what, forceInsert) {
        CRUD.stats.writesQueued++;
        var query = [],
            valCount = 0,
            values = [],
            valmap = [],
            names = [],
            that = this;

        for (var i in what.changedValues) {
            if (what.changedValues.hasOwnProperty(i) && what.hasField(i)) {
                names.push(i);
                values.push('?');
                valmap.push(what.changedValues[i] === undefined ? null : what.changedValues[i]);
            }
        }
        var defaults = CRUD.EntityManager.entities[what.className].defaults || {};
        for (var i in defaults) {
            names.push(i);
            values.push('?');
            valmap.push(defaults[i]);
        }

        if (what.getID() === false || undefined == what.getID() || forceInsert) { // new object : insert.
            // insert
            query.push('INSERT INTO ', CRUD.EntityManager.entities[what.className].table, '(', names.join(","), ') VALUES (', values.join(","), ');');
            CRUD.log(query.join(' '), valmap);
            return that.db.execute(query.join(' '), valmap).then(function(resultSet) {
                resultSet.Action = 'inserted';
                resultSet.ID = resultSet.rs.insertId;
                CRUD.stats.writesExecuted++;
                return resultSet;
            }, function(err, tx) {
                CRUD.stats.writesExecuted++;
                err.query = query.join(' ');
                err.values = valmap;
                return err;
            });

        } else { // existing : build an update query.
            query.push('UPDATE', CRUD.EntityManager.entities[what.className].table, 'SET');
            for (i = 0; i < names.length; i++) {
                query.push(names[i] + ' = ?');
                if (i < names.length - 1) query.push(',');
            }
            valmap.push(what.getID());
            query.push('WHERE', CRUD.EntityManager.getPrimary(what.className), '= ?');

            return that.db.execute(query.join(' '), valmap).then(function(resultSet) {
                CRUD.stats.writesExecuted++;
                resultSet.Action = 'updated';
                return resultSet;
            }, function(err, tx) {
                CRUD.stats.writesExecuted++;
                return;
            });
        }
    }
    this.Delete = function(what, events) {
        var query = [],
            values = [],
            valmap = [],
            names = [],
            that = this;
        if (what.getID() !== false) {
            // insert
            query.push('delete from', CRUD.EntityManager.entities[what.className].table, 'where', CRUD.EntityManager.getPrimary(what.className), '= ?');
            return new Promise(function(resolve, fail) {
                that.db.execute(query.join(' '), [what.getID()]).then(function(resultSet) {
                    resultSet.Action = 'deleted';
                    resolve(resultSet);
                }, function(e) {
                    CRUD.log("error deleting element from db: ", e);
                    fail(e);
                })
            });
        } else {
            return false;
        }
    }

    return this;
};


/*
---

CRUD.Database.js, a simple database abstraction layer.
Adapted from mootools Database.js by  Dipl.-Ing. (FH) AndrÃ© Fiedler <kontakt@visualdrugs.net>
Removed all moo dependencies and converted to POJS
December 2013: Updated for use of promises.
...
*/
CRUD.Database = function(name, options) {
    options = options || {
        version: '1.0',
        estimatedSize: 655360
    };

    var lastInsertRowId = 0;
    var db = false;
    var dbName = name || false;

    this.lastInsertId = function() {
        return lastInsertRowId;
    };

    this.close = function() {
        return db.close();
    };

    this.getDB = function() {
        return db;
    }



    /** 
     * Execute a db query and promise a resultset.
     */
    this.execute = function(sql, valueBindings) {
        if (!db) return;
        if (!db.transaction) {

        }
        return new Promise(function(resolve, fail) {
            function sqlOK(transaction, rs) {
                resolve(new CRUD.Database.ResultSet(rs));
            }

            function sqlFail(transaction, error) {
                CRUD.log("SQL FAIL!!", error, transaction, [sql.split(' VALUES (')[0], (s = JSON.stringify(valueBindings)).substr(1, s.length - 2)].join(' VALUES ') + ')');
                fail(error, transaction);
            }

            db.transaction(function(transaction) {
                CRUD.log("execing sql: ", sql, valueBindings);
                transaction.executeSql(sql, valueBindings, sqlOK, sqlFail);
            });
        });
    }

    this.connect = function() {
        return new Promise(function(resolve, fail) {
            try {
                db = openDatabase(dbName, options.version, '', options.estimatedSize);
                if (!db) {
                    fail("could not open database " + dbName);
                } else {
                    CRUD.log("DB connection to ", dbName, " opened!");
                    resolve(this);
                }
            } catch (E) {
                CRUD.log("DB ERROR " + E.toString());
                fail('ERROR!' + e.toString(), E);
            }
        });
    };
}

CRUD.Database.ResultSet = function(rs) {
    this.rs = rs;
    this.index = 0;
    return this;
};

CRUD.Database.ResultSet.prototype.next = function() {
    var row = null;
    if (this.index < this.rs.rows.length) {
        row = new CRUD.Database.ResultSet.Row(this.rs.rows.item(this.index++));
    }
    return row;
};

CRUD.Database.ResultSet.Row = function(row) {
    this.row = row;
    return this;
};

CRUD.Database.ResultSet.Row.prototype.get = function(index, defaultValue) {
    var col = this.row[index];
    return (col) ? col : defaultValue;
}

/**
 * My own query builder, ported from PHP to JS.
 * Should still be refactored and prettified, but works pretty nice so far.
 */
CRUD.Database.SQLBuilder = function(entity, filters, extras, justthese) {
    this.entity = entity instanceof CRUD.Entity ? entity.className : entity;
    this.filters = filters || {};
    this.extras = extras || [];
    justthese = justthese || [];
    this.wheres = [];
    this.joins = [];
    this.fields = [];
    this.orders = [];
    this.groups = [];
    this.limit = extras.limit ? 'LIMIT ' + extras.limit : 'LIMIT 0,1000';
    this.parameters = []; // parameters to bind to sql query.

    var tableName = CRUD.EntityManager.entities[this.entity].table;
    justthese = justthese.length > 0 ? justthese : CRUD.EntityManager.entities[this.entity].fields;
    for (var i = 0; i < justthese.length; i++) {
        this.fields.push(tableName + '.' + justthese[i]);
    }

    for (var prop in filters) {
        this.buildFilters(prop, filters[prop], this.entity);
    }
    this.buildOrderBy();
};

CRUD.Database.SQLBuilder.prototype = {
    buildFilters: function(what, value, _class) {
        var relatedClass = CRUD.EntityManager.hasRelation(_class, what);
        if (relatedClass) {
            for (var val in value) {
                this.buildFilters(val, value[val], what);
                this.buildJoins(_class, what);
            }
        } else if (!isNaN(parseInt(what, 10))) { // it's a custom sql where clause, just field=>value). unsafe because parameters are unbound, but very for custom queries.
            this.wheres.push(value);
        } else { // standard field=>value whereclause. Prefix with tablename for easy joins and push a value to the .
            if (what == 'ID') what = CRUD.EntityManager.getPrimary(_class);
            this.wheres.push(CRUD.EntityManager.entities[_class].table + '.' + what + ' = ?');
            this.parameters.push(value);
        }
    },

    buildOrderBy: function() // filter the 'extras' parameter for order by, group by and limit clauses.
    {
        if (!this.extras) return;
        if (this.extras.limit) {
            this.limit = "LIMIT " + this.extras.limit;
            delete this.extras.limit;
        }
        for (var key in this.extras) {
            var extra = this.extras[key].toUpperCase();
            if (extra.indexOf('ORDER BY') > -1) {
                this.orders.push(extra.replace('ORDER BY', ''));
                delete this.extras[key];
            }
            if (extra.indexOf('GROUP BY') > -1) {
                this.groups.push(extra.replace('GROUP BY', ''));
                delete this.extras[key];
            }
        }
        var entity = CRUD.EntityManager.entities[this.entity];
        if (entity.orderProperty && entity.orderDirection && this.orders.length === 0) {
            this.orders.push(entity.table + '.' + entity.orderProperty + " " + entity.orderDirection);
        }
    },

    buildJoins: function(theClass, parent) { // determine what joins to use
        if (!parent) return; // nothing to join on, skip.
        var entity = CRUD.EntityManager.entities[theClass];
        var parent = CRUD.EntityManager.entities[parent];

        switch (parent.relations[entity.className]) { // then check the relationtype
            case CRUD.RELATION_SINGLE:
            case CRUD.RELATION_FOREIGN:
                if (entity.fields.indexOf(parent.primary) > -1) {
                    this.addJoin(parent, entity, parent.primary);
                } else if (parent.fields.indexOf(entity.primary) > -1) {
                    this.addJoin(parent, entity, entity.primary);
                }
                break;
            case CRUD.RELATION_MANY: // it's a many:many relation. Join the connector table and then the related one.
                connectorClass = parent.connectors[entity.className];
                conn = CRUD.EntityManager.entities[connectorClass];
                this.addJoin(conn, entity, entity.primary).addJoin(parent, conn, parent.primary)
                break;
            case CRUD.RELATION_CUSTOM:
                var rel = parent.relations[entity.className];
                this.joins = this.joins.unshift(['LEFT JOIN', entity.table, 'ON', parent.table + '.' + rel.sourceProperty, '=', entity.table, '.', rel.targetProperty].join(' '));
                break;
            default:
                throw new Exception("Warning! class " + parent.className + " probably has no relation defined for class " + entity.className + "  or you did something terribly wrong..." + JSON.encode(parent.relations[_class]));
        }
    },

    addJoin: function(what, on, fromPrimary, toPrimary) {
        this.joins.push(['LEFT JOIN', what.table, 'ON', on.table + "." + fromPrimary, '=', what.table + '.' + (toPrimary || fromPrimary)].join(' '));
        return this;
    },

    buildQuery: function() {
        var where = this.wheres.length > 0 ? ' WHERE ' + this.wheres.join(" \n AND \n\t") : '';
        var order = (this.orders.length > 0) ? ' ORDER BY ' + this.orders.join(", ") : '';
        var group = (this.groups.length > 0) ? ' GROUP BY ' + this.groups.join(", ") : '';
        var query = 'SELECT ' + this.fields.join(", \n\t") + "\n FROM \n\t" + CRUD.EntityManager.entities[this.entity].table + "\n " + this.joins.join("\n ") + where + ' ' + group + ' ' + order + ' ' + this.limit;
        return ({
            query: query,
            parameters: this.parameters
        });
    },

    getCount: function() {
        var where = (this.wheres.length > 0) ? ' WHERE ' + this.wheres.join(" \n AND \n\t") : '';
        var order = '';
        var group = (this.groups.length > 0) ? ' GROUP BY ' + this.groups.join(", ") : '';
        var query = "SELECT count(*) FROM \n\t" + CRUD.EntityManager.entities[this.entity].table + "\n " + this.joins.join("\n ") + where + ' ' + group + ' ' + order + ' ';
        return (query);
    }
}