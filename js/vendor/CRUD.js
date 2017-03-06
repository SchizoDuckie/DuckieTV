if (!CRUD) var CRUD = {
    RELATION_SINGLE: 1,
    RELATION_FOREIGN: 2,
    RELATION_MANY: 3,
    RELATION_CUSTOM: 4,
    DEBUG: false,
    __log: {
        writesQueued: 0,
        writesExecuted: 0
    },
    __statsListeners: [],
    stats: {},
    addStatsListener: function(listener) {
        CRUD.__statsListeners.push(listener);
    },
    log: function() {
        if (CRUD.DEBUG) {
            console.log.apply(console, arguments);
        }
    }
};

/** 
 * Turn CRUD.stats into a proxy object with dynamic getters and setters (pipes to _log)
 * This way, we can fire events async
 */
Object.defineProperty(CRUD.stats, 'writesQueued', {
    get: function() {
        return CRUD.__log.writesQueued;
    },
    set: function(newValue) {
        CRUD.__log.writesQueued = newValue;
        CRUD.__statsListeners.map(function(listener) {
            listener(CRUD.__log);
        });
    }
});
Object.defineProperty(CRUD.stats, 'writesExecuted', {
    get: function() {
        return CRUD.__log.writesExecuted;
    },
    set: function(newValue) {
        CRUD.__log.writesExecuted = newValue;
        CRUD.__statsListeners.map(function(listener) {
            listener(CRUD.__log);
        });
    }
});





/** 
 * The main object proxy that returns either a fresh entity object or a promise that loads data, when you pass the primary key value to search for.
 *
 * The main idea behind this is that you can do:
 * var Project = CRUD.define(dbSetup, methods)
 * var p = new Project(); // now you can use get/set on p, after which you can use p.Persist().then(function() {} );
 * new Project(20).then(function(project) { project with id 20 has been fetched from adapter, use it here. })
 */


CRUD.EntityManager = (function() {

    this.entities = {};
    this.constructors = {};
    this.cache = {};
    this.connectionAdapter = false;

    this.defaultSetup = {
        className: 'CRUD.Entity',
        ID: false,
        table: false,
        primary: false,
        fields: [],
        indexes: [],
        autoSerialize: [],
        defaultValues: {},
        adapter: false,
        orderProperty: false,
        orderDirection: false,
        relations: {},
        connectors: {},
        createStatement: false,
        keys: []
    };

    var ucFirst = function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    /**
     * Register a new entity into the entity manager, which will manage it's properties, relations, and data.
     */
    this.registerEntity = function(namedFunction, dbSetup, methods) {

        namedFunction.prototype = Object.create(CRUD.Entity.prototype);
        namedFunction.prototype.constructor = CRUD.Entity;

        dbSetup.fields.map(function(field) {
            Object.defineProperty(namedFunction.prototype, field, {
                get: ((field in methods) && 'get' in methods[field]) ? methods[field].get : function() {
                    return this.get(field);
                },
                set: ((field in methods) && 'set' in methods[field]) ? methods[field].set : function(newValue) {
                    this.set(field, newValue);
                },
                enumerable: false,
                configurable: true
            });
        }, namedFunction);

        for (var j in methods) {
            if (dbSetup.fields.indexOf(j) == -1) {
                namedFunction.prototype[j] = methods[j];
            }
        }
        var className = dbSetup.className;
        Object.defineProperty(namedFunction.prototype, '__className__', {
            get: function() {
                return className;
            },
            enumerable: false,
            configurable: true
        });

        CRUD.log("Register entity", namedFunction, dbSetup, className);
        if (!(className in this.entities)) {
            this.entities[className] = Object.clone(this.defaultSetup);
        }
        for (var prop in dbSetup) {
            this.entities[className][prop] = dbSetup[prop];
        }

        this.constructors[className] = function(ID) {
            var instance = new namedFunction();

            if (ID) {
                instance.primaryKeyInit(ID);
            }
            return instance;
        };

        namedFunction.findByID = function(id) {
            var filters = {};
            filters[dbSetup.primary] = id;
            return CRUD.FindOne(className, filters);
        };

        namedFunction.Find = function(filters, options) {
            return CRUD.Find(className, filters, options);
        };

        namedFunction.FindOne = function(filters, options) {
            return CRUD.FindOne(className, filters, options);
        };

        dbSetup.fields.map(function(field) {
            namedFunction['findOneBy' + ucFirst(field)] = function(value, options) {
                var filter = {};
                filter[field] = value;
                return CRUD.FindOne(className, filter, options || {});
            };
            namedFunction['findBy' + ucFirst(field)] = function(value, options) {
                var filter = {};
                filter[field] = value;
                return CRUD.Find(className, filter, options || {});
            };
        });

        Object.keys(dbSetup.relations).map(function(name) {
            CRUD.log("creating relation search for ", name, " to ", className);
            namedFunction['findBy' + name] = function(filter, options) {
                var filters = {};
                filters[name] = filter;
                return CRUD.Find(className, filters, options || {});
            };
            namedFunction['findOneBy' + name] = function(filter, options) {
                var filters = {};
                filters[name] = filter;
                return CRUD.FindOne(className, filters, options || {});
            };
        });

        return namedFunction;
    };

    this.getPrimary = function(className) {
        if (!className || !this.entities[className]) {
            throw "Invalid className passed to CRUD.EntityManager.getPrimary : " + className;
        }
        return this.entities[className].primary;
    };

    this.getDefaultValues = function(className) {
        if (!className || !this.entities[className]) {
            throw "Invalid className passed to CRUD.EntityManager.getDefaultValues : " + className;
        }
        return this.entities[className].defaultValues;
    };

    /** 
     * Set and initialize the connection adapter.
     */
    this.setAdapter = function(adapter) {
        this.connectionAdapter = adapter;
        return this.connectionAdapter.Init();
    };

    this.getAdapter = function() {
        return this.connectionAdapter;
    };

    this.getFields = function(className) {
        return this.entities[className].fields;
    };
    this.hasRelation = function(className, related) {
        return ((related in this.entities[className].relations));
    };

    return this;

}());

CRUD.define = function(namedFunction, properties, methods) {
    return CRUD.EntityManager.registerEntity(namedFunction, properties, methods);

};

CRUD.setAdapter = function(adapter) {
    return CRUD.EntityManager.setAdapter(adapter);
};


/**
 * CRUD.Find is probably the function that you'll use most to query things:
 *
 * Syntax:
 * CRUD.Find(Product, { Catalog: { ID: 1 }} ).then( function(products) {
 *		for(var i=0; i< products.length; i++) {
 *			$$(".body")[0].adopt(products[i].display());
 *		}
 *	}, function(error) { CRUD.log("ERROR IN CRUD.FIND for catalog 1 ", error); });
 */
CRUD.Find = function(obj, filters, options) {
    var type = null;

    if (obj instanceof CRUD.Entity || obj.prototype instanceof CRUD.Entity) {
        type = obj.getType();

        if (obj.getID() !== false) {
            CRUD.log("Object has an ID! ", ID, type);
            filters.ID = obj.getID();
            filters.type = filters;
        }
    } else if ((obj in CRUD.EntityManager.entities)) {
        type = obj;
    } else {
        throw "CRUD.Find cannot search for non-CRUD objects like " + obj + "!";
    }

    return CRUD.EntityManager.getAdapter().Find(type, filters, options).then(function(results) {
        return results.map(function(el) {
            if (!(type in CRUD.EntityManager.cache)) {
                CRUD.EntityManager.cache[type] = {};
            }
            var idProp = CRUD.EntityManager.entities[type].primary;
            if (!(el[idProp] in CRUD.EntityManager.cache[type])) {
                CRUD.EntityManager.cache[type][el[idProp]] = new CRUD.EntityManager.constructors[type]();
            }
            return CRUD.EntityManager.cache[type][el[idProp]].importValues(el);
        });
    });
};

/** 
 * Uses CRUD.find with a limit 0,1 and returns the first result.
 * @returns Promise
 */
CRUD.FindOne = function(obj, filters, options) {
    options = options || {};
    options.limit = 1;
    return this.Find(obj, filters, options).then(function(result) {
        return result[0];
    });
};


CRUD.fromCache = function(obj, values) {
    try {
        obj = (typeof obj == 'function') ? new obj() : new CRUD.EntityManager.constructors[obj]();
        type = (obj instanceof CRUD.Entity) ? obj.getType() : false;
    } catch (E) {
        CRUD.log("CRUD.fromCache cannot create for non-CRUD objects like " + obj + "! \n" + E);
        return false;
    }
    obj.importValues(values, true);
    return obj;
};

/**
 * Default interface for a connection.
 * Implement these methods for a new adapter.
 */
CRUD.ConnectionAdapter = function(endpoint, options) {
    this.endpoint = endpoint || false;
    this.options = options || {};

    this.Init = function() {
        CRUD.log("The Init method for you connection adapter is not implemented!");
        debugger;
    };
    this.Delete = function(what) {
        CRUD.log("The Delete method for your connection adaptor is not implemented!");
        debugger;
    };
    this.Persist = function(what) {
        CRUD.log("The Persist method for your connection adaptor is not implemented!");
        debugger;
    };
    this.Find = function(what, filters, sorting, justthese, options, filters) {
        CRUD.log("The Find method for your connection adaptor is not!");
        debugger;
    };
    return this;
};

CRUD.Entity = function(className, methods) {
    this.__values__ = {};
    this.__dirtyValues__ = {};
    return this;
};


CRUD.Entity.prototype = {

    getID: function() {
        return this.get(CRUD.EntityManager.getPrimary(this.getType())) || false;
    },

    asObject: function() {
        return this.__values__;
    },

    /** 
     * Proxy find function, that can be run on the entity instance itself.
     * Makes sure you can create object A, and find just relations connected to it.
     * example:
     *
     * var Project = new Project(1).then(function(proj) {  proj.find(Catalog).then(function( catalogs) { CRUD.log("Fetched catalogs!", catalogs); }});
     * // versus
     * var Project = CRUD.Find(Project, { ID : 1 }).then(function(proj) { CRUD.log("Found project 1", proj); });
     * // or use a join:
     * CRUD.Find(Project, { Catalog: { ID: 1 }}).then(function(projects) { CRUD.log("Found projects connected to catalog 1 !", projects); });
     *
     * @returns Promise
     */
    Find: function(type, filters, options) {
        options = options || {};
        filters = filters || {};
        filters[this.getType()] = {};
        filters[this.getType()][CRUD.EntityManager.getPrimary(this.getType())] = this.getID();
        return CRUD.Find(type, filters, options);
    },

    /**
     * Get al list of all the values to display.
     */
    getValues: function() {
        var v = this.__values__;
        if (this.____dirtyValues____ && Array.from(this.____dirtyValues____).length > 0) {
            for (var k in this.__dirtyValues__) {
                v[k] = this.__dirtyValues__[k];
            }
        }
        v.ID = this.getID();
        return v;
    },

    importValues: function(values, dirty) {
        for (var field in values) {
            if (CRUD.EntityManager.entities[this.getType()].autoSerialize.indexOf(field) > -1) {
                if (typeof values[field] !== "object") {
                    this.__values__[field] = JSON.parse(values[field]);
                    continue;
                }
            }
            this.__values__[field] = values[field];
        }
        if (dirty) {
            this.__dirtyValues__ = this.__values__;
            this.__values__ = {};
        }
        return this;
    },

    /**
     * Accessor. Gets one field, optionally returns the default value.
     */
    get: function(field, def) {
        var ret;
        if (field in this.__dirtyValues__) {
            ret = this.__dirtyValues__[field];
        } else if ((field in this.__values__)) {
            ret = this.__values__[field];
        } else {
            CRUD.log("Could not find field '" + field + "' in '" + this.getType() + "' (for get)");
        }
        return ret;
    },

    /**
     * Setter, accepts key / value or object with keys/values
     */
    set: function(field, value) {
        if ((field in this)) {
            if (this.get(field) !== value && !([null, undefined].indexOf(this.get(field)) > -1 && [null, undefined].indexOf(value) > -1)) {
                if (CRUD.EntityManager.entities[this.getType()].autoSerialize.indexOf(field) > -1) {
                    if (JSON.stringify(this.get(field)) != JSON.stringify(value)) {
                        this.__dirtyValues__[field] = value;
                    }
                } else {
                    this.__dirtyValues__[field] = value;
                }
            }
        } else {
            CRUD.log("Could not find field '" + field + "' in '" + this.getType() + "' (for set)");
        }
    },

    /**
     * Persist changes on object using CRUD.Entity.set through the adapter.
     */
    Persist: function(forceInsert) {
        var that = this,
            thatType = this.getType();
        return new Promise(function(resolve, fail) {
            if (!forceInsert && Object.keys(that.__dirtyValues__).length == 0) return resolve();

            if (that.get(CRUD.EntityManager.getPrimary(that.getType())) === false || forceInsert) {
                var defaults = CRUD.EntityManager.entities[that.getType()].defaultValues;
                if (Object.keys(defaults).length > 0) {
                    for (var i in defaults) {
                        if ((i in that) && !that.__dirtyValues__[i]) {
                            that.__dirtyValues__[i] = defaults[i];
                        }
                    }
                }
            }

            return CRUD.EntityManager.getAdapter().Persist(that, forceInsert).then(function(result) {
                CRUD.log(that.getType() + " has been persisted. Result: " + result.Action + ". New Values: " + JSON.stringify(that.__dirtyValues__));
                if (result.Action == "inserted") {
                    that.__dirtyValues__[CRUD.EntityManager.getPrimary(thatType)] = result.ID;
                    if (!(thatType in CRUD.EntityManager.cache)) {
                        CRUD.EntityManager.cache[thatType] = {};
                    }
                    CRUD.EntityManager.cache[thatType][result.ID] = that;
                }
                for (var i in that.__dirtyValues__) {
                    that.__values__[i] = that.__dirtyValues__[i];
                }
                that.__dirtyValues__ = {};
                that.ID = that.__values__[CRUD.EntityManager.getPrimary(thatType)];

                resolve(result);
            }, function(e) {
                CRUD.log("Error saving CRUD", that, e);
                fail(e);
            });

        });
    },


    /**
     * Delete the object via the adapter.
     * Allows you to call Persist() again on the same object by just setting the ID to false.
     */
    Delete: function() {
        var that = this;
        return CRUD.EntityManager.getAdapter().Delete(that).then(function(result) {
            if (result.Action == 'deleted') {
                CRUD.log(that.getType() + " " + that.getID() + " has been deleted! ");
                delete CRUD.EntityManager.cache[that.getType()][that.getID()];
                that.__values__[CRUD.EntityManager.getPrimary(that.getType())].ID = false;
            };
            return result;
        });
    },

    getType: function() {
        return this.__className__;
    },


    /** 
     * Connect 2 entities regardles of their relationship type.
     * Pass the object you want to connect this entity to to this function and
     * this will find out what it needs to do to set the correct properties in your persistence layer.
 * @TODO: update thisPrimary,    thatPrimary resolve functions to allow mapping using RELATION_CUSTOM,
    also,
    using identified_by propertys
     */
    Connect: function(to) {
        var targetType = to.getType();
        var thisType = this.getType();
        var thisPrimary = this.dbSetup.primary;
        var targetPrimary = to.dbSetup.primary;
        var that = this;
        new Promise(function(resolve, fail) {
            Promise.all([that.Persist(), to.Persist()]).then(function() {
                switch (that.dbSetup.relations[targetType]) {
                    case CRUD.RELATION_SINGLE:
                        to.set(thisPrimary, that.getID());
                        that.set(targetPrimary, to.getID());
                        break;
                    case CRUD.RELATION_FOREIGN:
                        if ((thisPrimary in to)) {
                            to.set(thisPrimary, that.getID());
                        }
                        if ((targetPrimary in that)) {
                            that.set(targetPrimary, to.getID());
                        }
                        break;
                    case CRUD.RELATION_MANY:
                        var connector = new window[that.dbSetup.connectors[targetType]]();
                        connector.set(thisPrimary, that.getID());
                        connector.set(targetPrimary, to.getID());
                        connector.Persist().then(resolve, fail);
                        return;
                        break;
                    case CRUD.RELATION_CUSTOM:
                        //@TODO
                        break;
                }
                if (that.dbSetup.relations[to.getType()] != CRUD.RELATION_MANY) {
                    Promise.all([to.Persist(), from.Persist()]).then(resolve, fail);
                }
            }, fail);
        });
    },

    Disconnect: function(from) {
        var targetType = from.getType();
        var thisType = this.getType();
        var thisPrimary = CRUD.EntityManager.getPrimary(this);
        var targetPrimary = CRUD.Entitymanager.getPrimary(from);
        var that = this;

        new Promise(function(resolve, fail) {
            Promise.all([that.Persist(), from.Persist()]).then(function() {
                switch (this.dbSetup.relations[from.getType()]) {
                    case CRUD.RELATION_SINGLE:
                        from.set(thisPrimary, null);
                        that.set(targetPrimary, null);
                        break;
                    case CRUD.RELATION_FOREIGN:
                        if ((thisPrimary in from)) {
                            from.set(thisPrimary, null);
                        }
                        if ((targetPrimary in that)) {
                            that.set(targetPrimary, null);
                        }
                        break;
                    case CRUD.RELATION_MANY:
                        var filters = {};
                        filters[thisPrimary] = this.getID();
                        filters[targetPrimary] = from.getID();

                        CRUD.FindOne(this.dbSetup.connectors[targetType], filters).then(function(target) {
                            target.Delete().then(resolve, fail);
                        }, fail);
                        return;
                        break;
                    case CRUD.RELATION_CUSTOM:
                        // TODO: implement.
                        break;
                }
                Promise.all([that.Persist(), this.Persist()]).then(resolve, fail);
            }, fail);
        });
    },


    primaryKeyInit: function(ID) {
        this.ID = ID || false;
        if (this.ID !== false) {
            return this.Find({
                "ID": ID
            });
        }
    },
    toJSON: function() {
        return this.asObject();
    }
};

if (!('clone' in Object)) {
    Object.clone = function(el) {
        return JSON.parse(JSON.stringify(el));
    };
}