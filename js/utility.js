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

console.log("%cDuckieTV", "color:transparent; font-size: 16pt; line-height: 125px; padding:25px; padding-top:30px; padding-bottom:60px; background-image:url(http://duckietv.github.io/DuckieTV/img/icon128.png); background-repeat:no-repeat; ", "quack!\n\n\n\n\n\n");