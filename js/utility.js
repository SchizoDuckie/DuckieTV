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