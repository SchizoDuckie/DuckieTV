/**
 * handy Shorthand function
 */
CRUD.executeQuery = function(query, bindings) {
    return CRUD.EntityManager.getAdapter().db.execute(query, bindings || []);
};

CRUD.SQLiteAdapter = function(database, dbOptions) {
    this.databaseName = database;
    this.dbOptions = dbOptions;
    this.lastQuery = false;
    this.initializing = true;
    CRUD.ConnectionAdapter.apply(this, arguments);
    var db;
    var self = this;

    this.Init = function() {
        this.db = db = new CRUD.Database(self.databaseName);
        return db.connect().then(function() {
            CRUD.log("SQLITE connection created to ", self.databaseName);
            return verifyTables().then(function() {
                self.initializing = false;
            });
        });
    };

    function updateQuerySuccess(resultSet) {
        CRUD.stats.writesExecuted++;
        resultSet.Action = 'updated';
        return resultSet;
    }

    function updateQueryError(err, tx) {
        console.error("Update query error!", err);
        CRUD.stats.writesExecuted++;
        return;
    }

    function insertQuerySuccess(resultSet) {
        resultSet.Action = 'inserted';
        resultSet.ID = resultSet.rs.insertId;
        CRUD.stats.writesExecuted++;
        return resultSet;
    }

    function insertQueryError(err, tx) {
        CRUD.stats.writesExecuted++;
        //err.query = query.join(' ');
        //err.__values__ = valmap;
        console.error("Insert query error: ", err);
        return err;
    }

    var verifyTables = function() {
            CRUD.log('verifying that tables exist');
            var tables = [],
                indexes = {};
            // fetch existing tables
            return db.execute("select type,name,tbl_name from sqlite_master").then(function(resultset) {
                while (r = resultset.next()) {
                    if (r.row.name.indexOf('sqlite_autoindex') > -1 || r.row.name == '__WebKitDatabaseInfoTable__') continue;
                    if (r.row.type == 'table') {
                        tables.push(r.row.tbl_name);
                    } else if (r.row.type == 'index') {
                        if (!(r.row.tbl_name in indexes)) {
                            indexes[r.row.tbl_name] = [];
                        }
                        indexes[r.row.tbl_name].push(r.row.name);
                    }
                }
                return;
            }).then(function() {
                // verify that all tables exist
                return Promise.all(Object.keys(CRUD.EntityManager.entities).map(function(entityName) {
                    var entity = CRUD.EntityManager.entities[entityName];
                    if (tables.indexOf(entity.table) == -1) {
                        if (!entity.createStatement) {
                            throw "No create statement found for " + entity.className + ". Don't know how to create table.";
                        }
                        return db.execute(entity.createStatement).then(function() {
                            tables.push(entity.table);
                            localStorage.setItem('database.version.' + entity.table, ('migrations' in entity) ? Math.max.apply(Math, Object.keys(entity.migrations)) : 1);
                            CRUD.log(entity.className + " table created.");
                            return entity;
                        }, function(err) {
                            CRUD.log("Error creating " + entity.className, err);
                            throw "Error creating table: " + entity.table + " for " + entity.className;
                        }).then(createFixtures).then(function() {
                            CRUD.log("Table created and fixtures inserted for ", entity.className);
                            return;
                        });
                    }
                    return;
                }));
            }).then(function() {
                // verify that all indexes exist.
                return Promise.all(Object.keys(CRUD.EntityManager.entities).map(function(entityName) {
                    var entity = CRUD.EntityManager.entities[entityName];
                    if (entity.migrations) {
                        var currentVersion = !localStorage.getItem('database.version.' + entity.table) ? 1 : parseInt(localStorage.getItem('database.version.' + entity.table), 10);
                        if (isNaN(currentVersion)) {
                            currentVersion = 1;
                        }
                        var highestVersion = Math.max.apply(Math, Object.keys(entity.migrations));
                        if (currentVersion == highestVersion) return;
                        return Promise.all(Object.keys(entity.migrations).map(function(version) {
                            if (parseInt(version) > currentVersion) {
                                return Promise.all(entity.migrations[version].map(function(migration) {
                                    CRUD.log('Executing migration: ', migration);
                                    return db.execute(migration).then(function(result) {
                                        CRUD.log("Migration success!", result);
                                        return true;
                                    }, function(err) {
                                        throw "Migration " + version + " failed for entity " + entityName;
                                    });
                                })).then(function() {
                                    CRUD.log("All migrations executed for version ", version);
                                    localStorage.setItem('database.version.' + entity.table, version);
                                    return true;
                                });
                            }
                            return true;
                        }));
                    }
                }));
            }).then(function() {
                // create listed indexes if they don't already exist.
                return Promise.all(Object.keys(CRUD.EntityManager.entities).map(function(entityName) {
                    var entity = CRUD.EntityManager.entities[entityName];
                    if (('indexes' in entity)) {
                        return Promise.all(entity.indexes.map(function(index) {
                            var indexName = index.replace(/\W/g, '') + '_idx';
                            if (!(entity.table in indexes) || indexes[entity.table].indexOf(indexName) == -1) {
                                return db.execute("create index if not exists " + indexName + " on " + entity.table + " (" + index + ")").then(function(result) {
                                    CRUD.log("index created: ", entity.table, index, indexName);
                                    if (!(entity.table in indexes)) {
                                        indexes[entity.table] = [];
                                    }
                                    indexes[entity.table].push(indexName);
                                    return;
                                });
                            }
                            return;
                        }));
                    }
                }));
            }).then(function(result) {
                CRUD.log("All migrations are done!");
                self.initializing = false;
            });
        },

        createFixtures = function(entity) {
            return new Promise(function(resolve, reject) {
                if (!entity.fixtures) return resolve();
                return Promise.all(entity.fixtures.map(function(fixture) {
                    CRUD.fromCache(entity.getType(), entity.fixtures[i]).Persist(true, 'INSERT');
                })).then(resolve, reject);
            });
        },

        delayUntilSetupDone = function(func) {
            if (!self.initializing) {
                return func();
            } else {
                setTimeout(delayUntilSetupDone, 50, func);
            }
        };

    this.Find = function(what, filters, options) {
        var builder = new CRUD.Database.SQLBuilder(what, filters, options);
        var query = builder.buildQuery();

        CRUD.log("Executing query via sqliteadapter: ", options, query);
        return new Promise(function(resolve, fail) {
            return delayUntilSetupDone(function() {
                db.execute(query.query, query.parameters).then(function(resultset) {
                    var row, output = [];
                    while (row = resultset.next()) {
                        output.push(row.row);
                    }
                    resolve(output);
                }, function(resultSet, sqlError) {
                    CRUD.log('SQL Error in FIND : ', sqlError, resultSet, query);
                    fail();
                });
            });
        });
    };

    this.Persist = function(what, forceInsert) {
        CRUD.stats.writesQueued++;
        var query = [],
            values = [],
            valmap = [],
            names = [];

        function mapValues(field) {
            names.push(field);
            values.push('?');
            valmap.push(what.__dirtyValues__[field]);
        }

        function mapChangedValues(field) {
            if (!(field in what.__dirtyValues__) && !(field in what.__values__)) {
                names.push(field);
                values.push('?');
                valmap.push(CRUD.EntityManager.entities[what.getType()].defaultValues[field]);
            }
        }

        function mapAutoSerialize(field) {
            if (names.indexOf(field) > -1) {
                valmap[names.indexOf(field)] = JSON.stringify(valmap[names.indexOf(field)]);
            }
        }

        // iterate all fields changed 
        Object.keys(what.__dirtyValues__).map(mapValues);
        // add defaults
        Object.keys(CRUD.EntityManager.entities[what.getType()].defaultValues).map(mapChangedValues);

        // json_encode any fields that are defined as needing serializing
        CRUD.EntityManager.entities[what.getType()].autoSerialize.map(mapAutoSerialize);

        if (what.getID() === false || undefined === what.getID() || forceInsert) { // new object : insert.
            // insert
            query.push('INSERT INTO ', CRUD.EntityManager.entities[what.getType()].table, '(', names.join(","), ') VALUES (', values.join(","), ');');
            CRUD.log(query.join(' '), valmap);
            return db.execute(query.join(' '), valmap).then(insertQuerySuccess, insertQueryError);
        } else { // existing : build an update query.
            query.push('UPDATE', CRUD.EntityManager.entities[what.getType()].table, 'SET', names.map(function(name) {
                return name + ' = ?';
            }).join(','));
            valmap.push(what.getID());
            query.push('WHERE', CRUD.EntityManager.getPrimary(what.getType()), '= ?');

            return db.execute(query.join(' '), valmap).then(updateQuerySuccess, updateQueryError);
        }
    };

    this.Delete = function(what, events) {
        if (what.getID() !== false) {
            query = ['delete from', CRUD.EntityManager.entities[what.getType()].table, 'where', CRUD.EntityManager.getPrimary(what.getType()), '= ?'].join(' ');
            return db.execute(query, [what.getID()]).then(function(resultSet) {
                resultSet.Action = 'deleted';
                return resultSet;
            }, function(e) {
                CRUD.log("error deleting element from db: ", e);
                throw e;
            });
        } else {
            return false;
        }
    };

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
    };

    /** 
     * Execute a db query and promise a resultset.
     */
    this.execute = function(sql, valueBindings) {
        if (!db) return;
        if (!db.transaction) {

        }
        return new Promise(function(resolve, fail) {
            db.transaction(function(transaction) {
                CRUD.log("execing sql: ", sql, valueBindings);

                function sqlOK(transaction, rs) {
                    resolve(new CRUD.Database.ResultSet(rs));
                }

                function sqlFail(transaction, error) {
                    if (sql && valueBindings) {
                        CRUD.log("SQL FAIL!!", error, transaction, [sql.split(' VALUES (')[0], (s = JSON.stringify(valueBindings)).substr(1, s.length - 2)].join(' VALUES (') + ')');
                    } else {
                        CRUD.log("SQL FAIL!!", error, transaction);
                    }
                    fail(error, transaction);
                }

                transaction.executeSql(sql, valueBindings, sqlOK, sqlFail);
            });
        });
    };

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
                fail('ERROR!' + E.toString(), E);
            }
        });
    };
};

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
};

/**
 * My own query builder, ported from PHP to JS.
 * Should still be refactored and prettified, but works pretty nice so far.
 */
CRUD.Database.SQLBuilder = function(entity, filters, options) {
    this.entity = entity instanceof CRUD.Entity ? entity.getType() : entity;
    this.entityConfig = CRUD.EntityManager.entities[this.entity];
    this.filters = filters || {};
    this.options = options || {};
    this.justthese = [];
    this.wheres = [];
    this.joins = [];
    this.fields = [];
    this.orders = [];
    this.groups = [];
    this.parameters = []; // parameters to bind to sql query.

    Object.keys(this.filters).map(function(key) {
        this.buildFilters(key, this.filters[key], this.entity);
    }, this);

    if (this.options.orderBy) {
        this.orders.push(this.prefixFieldNames(this.options.orderBy.replace('ORDER BY', '')));
    } else {
        if (this.entityConfig.orderProperty && this.entityConfig.orderDirection && this.orders.length === 0) {
            this.orders.push(this.getFieldName(this.entityConfig.orderProperty) + " " + this.entityConfig.orderDirection);
        }
    }

    if (this.options.groupBy) {
        this.groups.push(this.options.groupBy.replace('GROUP BY', ''));
    }

    this.limit = this.options.limit ? 'LIMIT ' + options.limit : 'LIMIT 0,1000';

    (this.options.justthese || CRUD.EntityManager.entities[this.entity].fields).map(function(field) {
        this.fields.push(this.getFieldName(field));
    }, this);
};


CRUD.Database.SQLBuilder.prototype = {

    getFieldName: function(field, table) {
        return (table || this.entityConfig.table) + '.' + field;
    },

    prefixFieldNames: function(text) {
        var fields = text.split(',');
        return fields.map(function(field) {
            var f = field.trim().split(' ');
            var direction = f[1].toUpperCase().match(/(ASC|DESC)/)[0];
            field = f[0];
            if (this.entityConfig.fields.indexOf(field) > -1) {
                field = this.getFieldName(field);
            }
            return field + ' ' + direction;
        }, this).join(', ');
    },

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
            this.wheres.push(this.getFieldName(what, CRUD.EntityManager.entities[_class].table) + ' = ?');
            this.parameters.push(value);
        }
    },

    buildJoins: function(theClass, parent) { // determine what joins to use
        if (!parent) return; // nothing to join on, skip.
        var entity = CRUD.EntityManager.entities[theClass];
        parent = CRUD.EntityManager.entities[parent];

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
                connectorClass = parent.connectors[entity.getType()];
                conn = CRUD.EntityManager.entities[connectorClass];
                this.addJoin(conn, entity, entity.primary).addJoin(parent, conn, parent.primary);
                break;
            case CRUD.RELATION_CUSTOM:
                var rel = parent.relations[entity.getType()];
                this.joins = this.joins.unshift(['LEFT JOIN', entity.table, 'ON', this.getFieldName(rel.sourceProperty, parent.table), '=', this.getFieldName(rel.targetProperty, entity.table)].join(' '));
                break;
            default:
                throw new Exception("Warning! class " + parent.getType() + " probably has no relation defined for class " + entity.getType() + "  or you did something terribly wrong..." + JSON.encode(parent.relations[_class]));
        }
    },

    addJoin: function(what, on, fromPrimary, toPrimary) {
        var join = ['LEFT JOIN', what.table, 'ON', this.getFieldName(fromPrimary, on.table), '=', this.getFieldName(toPrimary || fromPrimary, what.table)].join(' ');
        if (this.joins.indexOf(join) == -1) {
            this.joins.push(join);
        }
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
        var group = (this.groups.length > 0) ? ' GROUP BY ' + this.groups.join(", ") : '';
        var query = "SELECT count(*) FROM \n\t" + CRUD.EntityManager.entities[this.entity].table + "\n " + this.joins.join("\n ") + where + ' ' + group;
        return (query);
    }
};