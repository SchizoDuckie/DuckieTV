/**
 * handy Shorthand function
 */
CRUD.executeQuery = function(query, bindings) {
    return CRUD.EntityManager.getAdapter().db.execute(query, bindings || []);
};

CRUD.BackgroundPageAdapter = function(database, dbOptions) {
    this.databaseName = database;
    this.dbOptions = dbOptions;
    this.lastQuery = false;
    this.initializing = true;
    CRUD.ConnectionAdapter.apply(this, arguments);
    var db;
    var self = this;

    this.Init = function() {
        this.db = db = new CRUD.BackgroundPageConnection(self.databaseName);
        return db.connect().then(function() {
            CRUD.log("Background Page connection created to ", self.databaseName);
            self.initializing = false;
        });
    };

    function querySuccess(resultSet) {
        CRUD.stats.writesExecuted++;
        return resultSet;
    }

    function queryError(err) {
        CRUD.stats.writesExecuted++;
        console.error("Query error: ", err);
        return err;
    }

    this.Find = function(what, filters, options) {
        return db.Find(what, filters, options);
    };

    this.Persist = function(what, forceInsert) {
        CRUD.stats.writesQueued++;
        return this.connection.Persist(what, forceInsert).then(querySuccess, queryError);
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

CRUD.BackgroundPageConnection = function() {

    var connection = false;
    var self = this;
    var unhandled = {};

    this.connect = function() {
        connection = chrome.runtime.connect({
            name: "CRUD"
        });

        connection.onMessage.addListener(function(msg) {
            if (!msg.guid) {
                throw new Error("unidentified port response");
            }
            if (!(msg.guid in unhandled)) {
                throw new Error("port response already handled or unknown");
            }
            if (!msg.error) {
                unhandled[msg.guid].resolve(msg.result);
            } else {
                unhandled[msg.guid].reject(msg);
            }
        });
        return new Promise(function(resolve) {
            return true;
        });
    }

    function send(msg) {
        connectionCheck();
        connection.postMessage(msg);
    }

    function connectionCheck() {
        if (!connection) {
            throw new Error("Not connected");
        }
    }

    this.Find = function(what, filters, options) {
        connectionCheck();
        var msg = {
            guid: guid(),
            type: 'Find',
            what: what,
            filters: filters,
            options: options
        }
        return new Promise(function(resolve, reject) {
            unhandled[msg.guid] = {
                resolve: resolve,
                reject: reject
            };
            send(msg);
        });
    }

    this.Persist = function() {
        connectionCheck();

    }

    this.Delete = function() {
        connectionCheck();

    }

    this.execute = function(sql, params) {
        connectionCheck();
        var msg = {
            guid: guid(),
            type: 'query',
            sql: sql,
            params: params
        }
        return new Promise(function(resolve, reject) {
            unhandled[msg.guid] = {
                resolve: resolve,
                reject: reject
            };
            send(msg);
        });

    }


    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    return this;
}