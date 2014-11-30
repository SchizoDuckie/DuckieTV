angular.module('DuckieTV.providers.alarms', [])
/**
 * Adapter class for generic alarms.
 * A performing abstraction between chrome alarms and generic timers based on the chrome
 * alarms api.
 * Important: Mimics chrome alarms' functionality of firing missing timers!
 */
.factory('AlarmService', function($q) {

    var ChromeAdapter = {

        getAll: function(cb) {
            return $q(function(resolve, reject) {
                chrome.alarms.getAll(function(alarms) {
                    resolve(alarms || []);
                });

            });
        },

        createAt: function(name, timestamp) {
            chrome.alarms.create(name, {
                when: timestamp
            });
        },

        createInterval: function(name, periodInMinutes) {
            chrome.alarms.create(name, {
                periodInMinutes: periodInMinutes
            });
        },

        createDelay: function(name, delayInMinutes) {
            chrome.alarms.create(name, {
                delayInMinutes: delayInMinutes
            });
        },

        clearAll: function() {
            return ($q(function(resolve, reject) {
                chrome.alarms.clearAll(resolve);
            }));
        },

        clear: function(alarmName) {
            chrome.alarms.clear(alarmName);
        },

        addListener: function(cb) {
            chrome.alarms.onAlarm.addListener(cb);
        },

        initialize: function() {

        }
    };

    var DuckieTVAdapter = {
        alarms: {},
        callback: null,
        /**
         * Pure JS implementation of the chrome alarm
         * @param string name   Name of this alarm.
         * @param double scheduledTime Time at which this alarm was scheduled to fire, in milliseconds past the epoch (e.g. Date.now() + n). For performance reasons, the alarm may have been delayed an arbitrary amount beyond this.
         * @param double delayInMinutes If not null, the alarm is a repeating alarm and will fire again in periodInMinutes minutes.
         */
        createAlarm: function(name, scheduledTime, delayInMinutes, periodInMinutes) {

            function alarm(name, scheduledTime, delayInMinutes, periodInMinutes) {
                this.name = name;
                this.scheduledTime = !scheduledTime ? 0 : scheduledTime;
                this.delayInMinutes = delayInMinutes || null;
                this.periodInMinutes = periodInMinutes || null;
                this.timeout = null;
                this.attach();
            }

            alarm.prototype = alarmProto;

            return new alarm(name, scheduledTime, delayInMinutes, periodInMinutes);
        },

        getAll: function(cb) {
            var alarmList = [];
            return $q(function(resolve, reject) {
                Object.keys(service.alarms).map(function(alarmName) {
                    alarmList.push(service.alarms[alarmName]);
                });
                resolve(alarmList);
            });
        },

        createAt: function(name, timestamp) {
            console.info("DuckieTV alarm create at :", name, timestamp);
            if (this.alarms[name]) {
                this.alarms[name].cancel();
            }
            this.alarms[name] = this.createAlarm(name, timestamp, null, null);
            service.persist();
        },

        createInterval: function(name, periodInMinutes) {
            console.info("DuckieTV alarm create interval :", name, periodInMinutes);
            if (this.alarms[name]) {
                this.alarms[name].cancel();
            }
            this.alarms[name] = this.createAlarm(name, null, null, periodInMinutes);
            service.persist();
        },

        createDelay: function(name, delayInMinutes) {
            console.info("DuckieTV alarm create delayInMinutes :", name, delayInMinutes);
            if (this.alarms[name]) {
                this.alarms[name].cancel();
            }
            this.alarms[name] = this.createAlarm(name, null, delayInMinutes, null);
            service.persist();
        },

        clear: function(alarmName) {
            console.info("DuckieTV alarm clear:", alarmName);
            if (alarmName in service.alarms) {
                service.alarms[alarmName].cancel();
                delete service.alarms[alarmName];
                service.persist();
            }
        },

        clearAll: function() {
            console.info("DuckieTV alarm clear all!:");
            Object.keys(service.alarms).map(function(alarmName) {
                service.alarms[alarmName].cancel();
                delete service.alarms[alarmName];
            });
            service.persist();
        },

        addListener: function(cb) {
            console.info("DuckieTV alarm add listener!", cb);
            this.callback = cb;
        },

        persist: function() {
            console.info("DuckieTV alarm persist!");
            var storage = {};
            for (var i in this.alarms) {
                storage[i] = JSON.parse(JSON.stringify(this.alarms[i]));
                for (var key in alarmProto) {
                    delete storage[i][key];
                }
            }
            console.log("store!", storage, this.alarms);
            localStorage.setItem('alarms', JSON.stringify(storage));
        },

        initialize: function() {
            if (localStorage.getItem('alarms')) {
                service.alarms = JSON.parse(localStorage.getItem('alarms'));
                Object.keys(service.alarms).map(function(alarmName) {
                    for (var key in alarmProto) {
                        service.alarms[alarmName][key] = alarmProto[key];
                    }
                    service.alarms[alarmName].wakeUp();
                });

            }

            console.info("DuckieTV alarm initialize!", this.alarms);
        }
    };


    service = ('chrome' in window && 'alarms' in window.chrome) ? ChromeAdapter : DuckieTVAdapter;

    var alarmProto = {

        attach: function() {
            var now = new Date().getTime();
            if (this.scheduledTime < now && this.delayInMinutes) {
                this.scheduledTime = now + (this.delayInMinutes * 60 * 1000);
            } else if (this.scheduledTime < now && this.periodInMinutes) {
                this.scheduledTime = now + (this.periodInMinutes * 60 * 1000);
            } else if (this.scheduledTime < now) {
                return;
            }
            this.timeout = setTimeout(this.fire.bind(this), this.scheduledTime - now);
        },

        fire: function() {
            console.info("Firing custom alarm!", this.name);
            if (typeof service.callback == "function") {
                console.log("Running callback!", this.name, service.callback);
                service.callback({
                    name: this.name
                });
            }
            if (this.periodInMinutes) {
                console.log("Periodic alarm! re-attach!");
                this.attach();
                service.persist();
            } else {
                service.clear(this.name);
            }
        },

        cancel: function() {
            clearTimeout(this.timeout);
        },

        /**
         * Run after deserialization
         */
        wakeUp: function() {
            console.log("Wake up alarm!", this.name, this.scheduledTime, new Date().getTime());
            if (this.scheduledTime < new Date().getTime()) {
                console.log("Alarm needs to fire!", this.scheduledTime);
                this.fire();
            }
            this.attach();
        },

        toString: function() {
            extra = this.periodInMinutes ? ' and restarts in ' + this.delayInMinutes + ' minutes' : '';
            return "Alarm: " + this.name + " Scheduled at " + new Date(this.scheduledTime) + extra;
        }
    };


    service.initialize();


    return service;
});
