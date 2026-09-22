/**
 * handy Shorthand function
 */
CRUD.executeQuery = function(query, bindings) {
    return CRUD.EntityManager.getAdapter().db.execute(query, bindings || []);
};

CRUD.SQLiteAdapter = function(database, dbOptions) {
    this.databaseName = database;
    this.dbOptions = Object.assign({ version: '1.0', estimatedSize: 655360 }, dbOptions || {});
    this.lastQuery = false;
    this.initializing = true;
    CRUD.ConnectionAdapter.apply(this, arguments);
    var db;
    var self = this;
    var initializationError = null;

    this.Init = function() {
        this.db = db = new CRUD.Database(self.databaseName, self.dbOptions);
        return db.connect().then(function() {
            CRUD.log("SQLITE connection created to ", self.databaseName);
            return verifyTables().then(function() {
                self.initializing = false;
            });
        }).catch(function(error) {
            initializationError = error;
            self.initializing = false;
            throw error;
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
        throw err;
    }

    function insertQuerySuccess(resultSet) {
        resultSet.Action = 'inserted';
        resultSet.ID = resultSet.insertId;
        CRUD.stats.writesExecuted++;
        return resultSet;
    }

    function insertQueryError(err, tx) {
        CRUD.stats.writesExecuted++;
        console.error("Insert query error: ", err);
        throw err;
    }

    function highestVersion(entity) {
        return entity.migrations ? Math.max.apply(Math, Object.keys(entity.migrations).map(Number)) : 1;
    }

    function writeSchemaVersion(entity, version) {
        var write = db.setSchemaVersion ? db.setSchemaVersion(entity.table, version) : Promise.resolve();
        return write.then(function() {
            localStorage.setItem('database.version.' + entity.table, version);
        });
    }

    function readSchemaVersion(entity) {
        if (db.getSchemaVersion) {
            return db.getSchemaVersion(entity.table).then(function(version) {
                if (version === null) throw new Error('Missing native schema version for ' + entity.table);
                return version;
            });
        }
        var version = parseInt(localStorage.getItem('database.version.' + entity.table), 10);
        return Promise.resolve(isNaN(version) ? 1 : version);
    }

    function migrateEntity(entityName) {
        var entity = CRUD.EntityManager.entities[entityName];
        if (!entity.migrations) return Promise.resolve();
        return readSchemaVersion(entity).then(function(currentVersion) {
            var versions = Object.keys(entity.migrations).map(Number).filter(function(version) {
                return version > currentVersion;
            }).sort(function(a, b) {
                return a - b;
            });
            return versions.reduce(function(promise, version) {
                return promise.then(function() {
                    CRUD.log('Executing migrations for ', entity.table, version);
                    if (db.batch) {
                        var statements = entity.migrations[version].map(function(sql) {
                            return { sql: sql, bindings: [] };
                        });
                        statements.push({
                            sql: 'INSERT INTO duckietv_schema (table_name, version) VALUES (?, ?) ON CONFLICT(table_name) DO UPDATE SET version = excluded.version',
                            bindings: [entity.table, version]
                        });
                        return db.batch(statements).then(function() {
                            localStorage.setItem('database.version.' + entity.table, version);
                        });
                    }
                    return entity.migrations[version].reduce(function(migrationPromise, migration) {
                        return migrationPromise.then(function() { return db.execute(migration); });
                    }, Promise.resolve()).then(function() {
                        return writeSchemaVersion(entity, version);
                    });
                });
            }, Promise.resolve());
        });
    }

    var verifyTables = function() {
            CRUD.log('verifying that tables exist');
            var tables = [],
                indexes = {};
            return db.execute("select type,name,tbl_name from sqlite_master").then(function(resultset) {
                return resultset.rows.filter(function(row) {
                    return row.name.indexOf('sqlite_autoindex') == -1 && row.name != '__WebKitDatabaseInfoTable__';
                }).map(function(row) {
                    if (row.type == 'table') {
                        tables.push(row.tbl_name);
                    } else if (row.type == 'index') {
                        if (!(row.tbl_name in indexes)) indexes[row.tbl_name] = [];
                        indexes[row.tbl_name].push(row.name);
                    }
                });
            }).then(function() {
                return Promise.all(Object.keys(CRUD.EntityManager.entities).map(function(entityName) {
                    var entity = CRUD.EntityManager.entities[entityName];
                    if (tables.indexOf(entity.table) > -1) return;
                    if (!entity.createStatement) throw new Error("No create statement found for " + entity.className);
                    var version = highestVersion(entity);
                    var create = db.batch ? db.batch([{
                        sql: entity.createStatement,
                        bindings: []
                    }, {
                        sql: 'INSERT INTO duckietv_schema (table_name, version) VALUES (?, ?)',
                        bindings: [entity.table, version]
                    }]) : db.execute(entity.createStatement).then(function() {
                        return writeSchemaVersion(entity, version);
                    });
                    return create.then(function() {
                        tables.push(entity.table);
                        localStorage.setItem('database.version.' + entity.table, version);
                    }).then(function() {
                        CRUD.log(entity.className + " table created.");
                        return createFixtures(entity);
                    }).catch(function(err) {
                        CRUD.log("Error creating " + entity.className, err);
                        throw err;
                    });
                }));
            }).then(function() {
                return Object.keys(CRUD.EntityManager.entities).reduce(function(promise, entityName) {
                    return promise.then(function() { return migrateEntity(entityName); });
                }, Promise.resolve());
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

                    return CRUD.fromCache(entity.className, fixture).Persist(true);
                })).then(resolve, reject);
            });
        },

        delayUntilSetupDone = function(func, fail) {
            if (initializationError) return fail(initializationError);
            if (!self.initializing) {
                return func();
            } else {
                setTimeout(delayUntilSetupDone, 50, func, fail);
            }
        };

    this.Find = function(what, filters, options) {
        var builder = new CRUD.Database.SQLBuilder(what, filters, options);
        var query = builder.buildQuery();

        return new Promise(function(resolve, fail) {
            delayUntilSetupDone(function() {
                CRUD.log("Executing query via sqliteadapter: ", options, query);
                db.execute(query.query, query.parameters).then(function(result) {
                        resolve(result.rows)
                    },
                    function(resultSet, sqlError) {
                        CRUD.log('SQL Error in FIND : ', sqlError, resultSet, query);
                        fail();
                    });
            }, fail);
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

    this.Delete = function(what) {
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
    if (CRUD.Database.connectionFactory) {
        return CRUD.Database.connectionFactory(name, options || {});
    }
    options = Object.assign({
        version: '1.0',
        estimatedSize: 655360
    }, options || {});

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

    var queryQueue = [];

    /**
     * Execute a db query and promise a resultset.
     * Queries are queue up based upon if they are insert or select queries.
     * selects get highest priority to not lock the UI when batch inserts or updates
     * are happening.
     */
    this.execute = function(sql, valueBindings) {
        if (!db) return;
        return new Promise(function(resolve, fail) {
            queryQueue[sql.indexOf('SELECT') === 0 ? 'unshift' : 'push']({
                sql: sql,
                valueBindings: valueBindings,
                resolve: resolve,
                fail: fail
            });
            setTimeout(processQueue, 10);
        });
    };

    function processQueue() {
        if (queryQueue.length > 0) {
            db.transaction(function(transaction) {
                var localQueue = queryQueue.splice(0, 25);
                if (localQueue.length === 0) return;
                localQueue.map(function(query) {

                    function sqlOK(transaction, rs) {
                        var output = {
                            rows: []
                        };
                        for (var i = 0; i < rs.rows.length; i++) {
                            output.rows.push(rs.rows.item(i));
                        }
                        if (('rowsAffected' in rs)) {
                            output.rowsAffected = rs.rowsAffected;
                            if (rs.rowsAffected > 0 && query.sql.indexOf('INSERT INTO') > -1) {
                                output.insertId = rs.insertId;
                            }
                        }
                        query.resolve(output);
                    }

                    function sqlFail(transaction, error) {
                        CRUD.log("SQL FAIL!!", error, transaction);
                        query.fail(error, transaction);
                    }
                    transaction.executeSql(query.sql, query.valueBindings, sqlOK, sqlFail);
                });
            });
        }
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
                fail('ERROR!' + E.toString(), E);
            }
        });
    };
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

    this.limit = this.options.limit ? 'LIMIT ' + options.limit : 'LIMIT 0,2000';

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
