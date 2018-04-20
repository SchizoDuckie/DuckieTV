/** DOMParser Polyfill */
(function(DOMParser) {
    "use strict";

    var DOMParser_proto = DOMParser.prototype,
        real_parseFromString = DOMParser_proto.parseFromString;

    // Firefox/Opera/IE throw errors on unsupported types
    try {
        // WebKit returns null on unsupported types
        if ((new DOMParser).parseFromString("", "text/html")) {
            // text/html parsing is natively supported
            return;
        }
    } catch (ex) {}

    DOMParser_proto.parseFromString = function(markup, type) {
        if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
            var
                doc = document.implementation.createHTMLDocument("");
            if (markup.toLowerCase().indexOf('<!doctype') > -1) {
                doc.documentElement.innerHTML = markup;
            } else {
                doc.body.innerHTML = markup;
            }
            return doc;
        } else {
            return real_parseFromString.apply(this, arguments);
        }
    };
}(DOMParser));

/**
 * Helper class for more fluent parsing of HTML results in a document parsed from string
 * Example:
 *
 * var scraper = new HTMLScraper(response.data);
 * scraper.walkSelector('table tr:not(:first-child)', function(node) {
 *   scraper.walkNodes(node.querySelectorAll('td'), function(cell, idx) {
 *     // do something with cells for each row.
 *   });
 * });
 *
 */
var HTMLScraper = function(text) {
    var parser = new DOMParser();
    this.doc = parser.parseFromString(text, "text/html");

    this.walkSelector = function(selector, callback) {
        return this.walkNodes(this.querySelectorAll(selector), callback);
    };

    this.querySelector = function(selector) {
        return this.doc.querySelector(selector);
    };

    this.querySelectorAll = function(selector) {
        return this.doc.querySelectorAll(selector);
    };

    this.walkNodes = function(nodes, callback) {
        return Array.prototype.map.call(nodes, callback);
    };
    return this;
};

/**
 * Allow for easy prototype extension.
 * This means you can create a class, and extend another class onto it,
 * while overwriting specific prototype implementations.
 * Call the parent class's prototype methods by referring to prototype.constructor.
 */

Function.prototype.extends = function(ParentClass, prototypeImplementations) {
    this.prototype = Object.create(ParentClass.prototype);
    this.prototype.constructor = ParentClass;
    if (undefined === prototypeImplementations) {
        prototypeImplementations = {};
    }

    // add all prototypeImplementations to the non-prototype chain for this function.
    Object.keys(prototypeImplementations).map(function(key) {
        this.prototype[key] = prototypeImplementations[key];
    }, this);
};

console.info("%cDuckieTV", "color:transparent; font-size: 16pt; line-height: 125px; padding:25px; padding-top:30px; padding-bottom:60px; background-image:url(https://duckietv.github.io/DuckieTV/img/logo/icon128.png); background-repeat:no-repeat; ", "quack!\n\n\n\n\n\n");

if (localStorage.getItem('optin_error_reporting')) {
    /* duckietv_halp */
    if (!localStorage.getItem('optin_error_reporting.start_time')) {
        localStorage.setItem('optin_error_reporting.start_time', new Date().getTime());
    };
    // if opt-in was enabled for more than 7 days then disable it
    var localDT = new Date().getTime();
    var halpEnabled = new Date(parseInt(localStorage.getItem('optin_error_reporting.start_time')));
    var halpExpiryDT = new Date(halpEnabled.getFullYear(), halpEnabled.getMonth(), halpEnabled.getDate() + 7, halpEnabled.getHours(), halpEnabled.getMinutes(), halpEnabled.getSeconds()).getTime();
    var timeToHalpExpiry = (halpExpiryDT - localDT);
    if (timeToHalpExpiry > 0) {
        // set up error tracking
        console.info('Opt-In Error Tracking Service Enabled.');
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = 'https://api.loggr.net/1/loggr.min.js?l=duckietv_115_halp&a=3f85c533e09d4a6e9af2065d597f511b';
        //s.src = 'https://api.loggr.net/1/loggr.min.js?l=duckietv_dev_halp&a=8c835f96de1e401597feb2389e4af473';  // garfield69's development testing loggr 
        document.body.appendChild(s);

        if (!localStorage.getItem('uniqueId')) {
            function guid() {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
                }
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            }
            localStorage.setItem('uniqueId', guid());
            console.info("Generated unique user identifier for opt-in error tracking:", localStorage.getItem('uniqueId'));
        }

        // trap runtime errors 
        window.onerror = function(msg, url, line) {
            var log = Loggr.Log;
            // dump UserPreferences
            var userPrefs = JSON.parse(localStorage.getItem('userPreferences'));
            var unwantedClientKeys = ['aria2', 'biglybt', 'deluge', 'ktorrent', 'qbittorrent', 'qbittorrent32plus', 'rtorrent', 'tixati', 'transmission', 'ttorrent', 'utorrent', 'utorrentwebui', 'vuze'];
            var activeClientKey = localStorage.getItem('torrenting.client').replace(/ /g, '').replace('3.2+', '32plus').replace('(pre3.2)', '').toLowerCase();
            if (localStorage.getItem('torrenting.client')) {
                unwantedClientKeys.splice(unwantedClientKeys.indexOf(activeClientKey), 1); // drop active client from list
            }
            Object.keys(userPrefs).map(function(key) {
                // redact passwords
                if (key.indexOf('password') > -1) {
                    userPrefs[key] = "*****";
                }
                // reduce list by dropping inactive keys (to help prevent loggr trunc)
                unwantedClientKeys.map(function(unwantedClientKey) {
                    if (key.indexOf(unwantedClientKey + '.') > -1) {
                        delete userPrefs[key];
                    }
                });
            });
            // dump local storage with exceptions to avoid overload.
            var dumpLocalStorage = JSON.parse(JSON.stringify(localStorage));
            ['userPreferences', 'torrenting.hashList', 'trakttv.token', 'trakttv.trending.cache', 'alarms', 'xem.mappings', 'xem.aliasmap', 'snr.name-exceptions', 'snr.date-exceptions', 'fanart.cache', 'jackett', 'trackers.fallBackList'].map(function(key) {
                delete dumpLocalStorage[key];
            });
            var data = "Message: " + msg + "<br>";
            data += "URL: " + url + "<br>";
            data += "Line: " + line + "<br>";
            data += "Platform: " + navigator.platform + "<br>";
            data += "User Agent: " + navigator.userAgent + "<br>";
            data += "Config: <pre>" + angular.toJson(userPrefs, true) + "</pre>";
            data += "Local Storage (filtered): <pre>" + angular.toJson(dumpLocalStorage, true) + "</pre>";
            log.events.createEvent()
                .text("Runtime error: " + msg)
                .tags("error")
                .user(localStorage.getItem('uniqueId'))
                .dataType(Loggr.dataType.html)
                .data(data)
                .post();
            console.error(msg, url, line);
        };

        // trap console errors
        console.olderror = console.error;
        console.error = function() {
            console.olderror(arguments);
            var log = Loggr.Log;
            // filter out unwanted error logging 
            var blacklist = ["connect call failed","could not load fanart"];
            var args = Array.prototype.slice.call(arguments);
            var wanted = true;
            if (typeof args !== 'undefined' && null !== args && args.length > 0) {
                blacklist.map(function(unwanted) {
                    if (args[0].toLowerCase().indexOf(unwanted) > -1) {
                        wanted = false; 
                    };
                });
            }
            if (wanted) {
                // dump UserPreferences
                var userPrefs = JSON.parse(localStorage.getItem('userPreferences'));
                var unwantedClientKeys = ['aria2', 'biglybt', 'deluge', 'ktorrent', 'qbittorrent', 'qbittorrent32plus', 'rtorrent', 'tixati', 'transmission', 'ttorrent', 'utorrent', 'utorrentwebui', 'vuze'];
                var activeClientKey = localStorage.getItem('torrenting.client').replace(/ /g, '').replace('3.2+', '32plus').replace('(pre3.2)', '').toLowerCase();
                if (localStorage.getItem('torrenting.client')) {
                    unwantedClientKeys.splice(unwantedClientKeys.indexOf(activeClientKey), 1); // drop active client from list
                }
                Object.keys(userPrefs).map(function(key) {
                    // redact passwords
                    if (key.indexOf('password') > -1) {
                        userPrefs[key] = "*****";
                    }
                    // reduce list by dropping inactive keys (to help prevent loggr trunc)
                    unwantedClientKeys.map(function(unwantedClientKey) {
                        if (key.indexOf(unwantedClientKey + '.') > -1) {
                            delete userPrefs[key];
                        }
                    });
                });
                // dump local storage with exceptions to avoid overload.
                var dumpLocalStorage = JSON.parse(JSON.stringify(localStorage));
                ['userPreferences', 'torrenting.hashList', 'trakttv.token', 'trakttv.trending.cache', 'alarms', 'xem.mappings', 'xem.aliasmap', 'snr.name-exceptions', 'snr.date-exceptions', 'fanart.cache', 'jackett', 'trackers.fallBackList'].map(function(key) {
                    delete dumpLocalStorage[key];
                });
                var data = "Message: " + JSON.stringify(arguments) + "<br>";
                data += "Platform: " + navigator.platform + "<br>";
                data += "User Agent: " + navigator.userAgent + "<br>";
                data += "Config: <pre>" + angular.toJson(userPrefs, true) + "</pre>";
                data += "Local Storage (filtered): <pre>" + angular.toJson(dumpLocalStorage, true) + "</pre>";
                log.events.createEvent()
                    .text("Console.error: " + JSON.stringify(arguments))
                    .tags("error")
                    .user(localStorage.getItem('uniqueId'))
                    .dataType(Loggr.dataType.html)
                    .data(data)
                    .post();
            }
        }
    } else {
        console.warn('Opt-In Error Tracking time limit of 7 days has expired. Turning off Error Tracking Service.');
        localStorage.removeItem('optin_error_reporting');
        localStorage.removeItem('optin_error_reporting.start_time');
    };

};

/**
 * extend the String object to add the getInfoHash method
 * if the String contains a base16 infoHash then extract it and return it
 * if the String contains a base32 infoHash then extract it, convert it to base16 and return that.
 */
String.prototype.getInfoHash = function() {
    var infoHash16 = this.match(/([0-9A-Fa-f]{40})/); // extract base16 infoHash
    if (infoHash16 && infoHash16.length) {
        return infoHash16[0].toUpperCase();
    } else {
        var infoHash32 = this.match(/([2-7A-Z]{32})/); // extract base32 infoHash
        if (infoHash32 && infoHash32.length) {
            return ("0".repeat(40) + basex16.encode(basex32.decode(infoHash32[0]))).slice(-40); // convert to base16 infohash (may need padding with zeroes to length 40)
        } else {
            return null; // infoHash not found in String.
        }
    }
};

/**
 * extend the String object to add the replaceInfoHash method
 * if the String contains a base16 infoHash then return the String with the infoHash in UpperCase.
 * if the String contains a base32 infoHash then replace it with the base16 equivalent.
 */
String.prototype.replaceInfoHash = function() {
    var infoHash16 = this.match(/([0-9A-Fa-f]{40})/); // extract base16 infoHash
    if (infoHash16 && infoHash16.length) {
        return this.replace(infoHash16[0], infoHash16[0].toUpperCase()); // replace base16 with upperCase
    } else {
        var infoHash32 = this.match(/([2-7A-Z]{32})/); // extract base32 infoHash
        if (infoHash32 && infoHash32.length) {
            return this.replace(infoHash32[0], ("0".repeat(40) + basex16.encode(basex32.decode(infoHash32[0]))).slice(-40)); // convert base32 to base16 infohash (may need padding with zeroes to length 40) and replace it in String
        } else {
            return this.toString(); // infoHash not found in String
        }
    }
};

/**
 * extend the Number object to add the minsToDhm method
 * converts numerical total minutes to a "days hours:minutes" string
 */
Number.prototype.minsToDhm = function() {
    var days = parseInt(this / (60 * 24));
    var hours = parseInt(this / 60) % 24;
    var minutes = parseInt(this) % 60;
    return days + " " + ("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2);
};

/**
 * extend the String object to add the dhmToMins method
 * converts a "days hours:minutes" string to numerical total minutes
 */
String.prototype.dhmToMins = function() {
    var dhmPart = this.split(/[\s:]+/, 3);
    if (dhmPart.length === 3) {
        return parseInt(dhmPart[0] * 24 * 60) + parseInt(dhmPart[1] * 60) + parseInt(dhmPart[2]);
    } else {
        return undefined;
    }
};

window.debug982 = (localStorage.getItem('debug982'));

/**
 * drop bebasRegular fontFamily if user enabled mixedCase
 */
if (localStorage.getItem('font.bebas.disabled')) {
    var elemStyle = document.createElement('style');
    elemStyle.id = "bebas-override";
    elemStyle.innerHTML = [
        "h1, h2, h3, strong, .inline-checkbox label, sidepanel .buttons .torrent-mini-remote-control>span, .settings .buttons .btn {",
            "font-family: helvetica, sans-serif !important;",
        "}",
        "strong {",
            "font-weight: bold !important;",
        "}",
            "strong, sidepanel .buttons .torrent-mini-remote-control> span, sidepanel .buttons strong {",
            "letter-spacing: normal !important;",
        "}"
    ].join(' ');
    document.body.insertBefore(elemStyle,document.body.firstChild);            
}
