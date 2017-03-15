CRUD.DEBUG = false;
if (localStorage.getItem('CRUD.DEBUG')) {
    CRUD.DEBUG = (localStorage.getItem('CRUD.DEBUG') === 'true') ? true : false;
};

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
        return this.db.Persist(what, forceInsert).then(querySuccess, queryError);
    };

    this.Delete = function(what, events) {
        if (what.getID() !== false) {
            query = ['delete from', CRUD.EntityManager.entities[what.getType()].table, 'where', CRUD.EntityManager.getPrimary(what.getType()), '= ?'].join(' ');
            return db.execute(query, [what.getID()]).then(function(resultSet) {
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

/**
 * Background page connection
 * Opens a transparent promise-based connection pipe to the background page
 * where all SQL queries are handled as if they were on the foreground.
 * 
 */
CRUD.BackgroundPageConnection = function() {

    var connection = false;
    var self = this;
    var unhandled = {};


    /**
     * Open a port to the background page and listen for incoming messages on it.
     * Incoming messages are matched against the unhandled guid list and when matched 
     * the promise is resolved or rejected based on if an 'error' property is available
     * in the response message.
     */
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
                delete unhandled[msg.guid];
            } else {
                unhandled[msg.guid].reject(msg);
                delete unhandled[msg.guid];
            }
        });
        return new Promise(function(resolve) {
            resolve(true);
        });
    }

    /**
     * generate a new message to send to the background page
     * takes a json object with at least a 'command' property.
     * a GUID is auto-generated and sent along to the background page,
     * where the command is processed and the result sent back wrapped in a message with the GUID.
     * 
     * A new Promise is created, that's stored under the GUID in the 'unhandled' object.
     * The promise then resolves when the background page sends back a message with the same GUID
     * and the promise is deleted and memory freed.
     * @return Promise
     */
    function send(msg) {

        if (!connection) {
            throw new Error("Not connected");
        }

        msg.guid = guid();
        return new Promise(function(resolve, reject) {
            unhandled[msg.guid] = {
                msg: msg,
                resolve: resolve,
                reject: reject
            };
            connection.postMessage(msg);
        });

    }

    /**
     *
     */
    this.Find = function(what, filters, options) {
        return send({
            command: 'Find',
            what: what,
            filters: filters,
            options: options
        });
    }

    /**
     * Send an entity to the background page to have it persisted
     */
    this.Persist = function(what, forceInsert) {
        return send({
            command: 'Persist',
            type: what.getType(),
            ID: what.getID(),
            values: what.__dirtyValues__
        });
    }

    /**
     * Forward a 'Delete' instruction to the background page
     */
    this.Delete = function(what) {
        return send({
            command: 'Delete',
            what: what,
            type: what.getType(),
            params: params
        });
    }

    /**
     * Execute raw SQL query
     */
    this.execute = function(sql, params) {
        return send({
            command: 'query',
            sql: sql,
            params: params
        });
    }

    var counter = 0;

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4() + "-" + counter++;
    }

    return this;
}