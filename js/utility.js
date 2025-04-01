/** DOMParser Polyfill */
(function(DOMParser) {
  'use strict'

  var DOMParser_proto = DOMParser.prototype

  var real_parseFromString = DOMParser_proto.parseFromString

  // Firefox/Opera/IE throw errors on unsupported types
  try {
    // WebKit returns null on unsupported types
    if ((new DOMParser()).parseFromString('', 'text/html')) {
      // text/html parsing is natively supported
      return
    }
  } catch (ex) {}

  DOMParser_proto.parseFromString = function(markup, type) {
    if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
      var
        doc = document.implementation.createHTMLDocument('')
      if (markup.toLowerCase().indexOf('<!doctype') > -1) {
        doc.documentElement.innerHTML = markup
      } else {
        doc.body.innerHTML = markup
      }
      return doc
    } else {
      return real_parseFromString.apply(this, arguments)
    }
  }
}(DOMParser))

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
  var parser = new DOMParser()
  this.doc = parser.parseFromString(text, 'text/html')

  this.walkSelector = function(selector, callback) {
    return this.walkNodes(this.querySelectorAll(selector), callback)
  }

  this.querySelector = function(selector) {
    return this.doc.querySelector(selector)
  }

  this.querySelectorAll = function(selector) {
    return this.doc.querySelectorAll(selector)
  }

  this.walkNodes = function(nodes, callback) {
    return Array.prototype.map.call(nodes, callback)
  }
  return this
}

/**
 * Allow for easy prototype extension.
 * This means you can create a class, and extend another class onto it,
 * while overwriting specific prototype implementations.
 * Call the parent class's prototype methods by referring to prototype.constructor.
 */

Function.prototype.extends = function(ParentClass, prototypeImplementations) {
  this.prototype = Object.create(ParentClass.prototype)
  this.prototype.constructor = ParentClass
  if (undefined === prototypeImplementations) {
    prototypeImplementations = {}
  }

  // add all prototypeImplementations to the non-prototype chain for this function.
  Object.keys(prototypeImplementations).map(function(key) {
    this.prototype[key] = prototypeImplementations[key]
  }, this)
}

/**
 * extend the String object to add the getInfoHash method
 * if the String contains a base16 infoHash then extract it and return it
 * if the String contains a base32 infoHash then extract it, convert it to base16 and return that.
 */
String.prototype.getInfoHash = function() {
  var infoHash16 = this.match(/([0-9A-Fa-f]{40})/) // extract base16 infoHash
  if (infoHash16 && infoHash16.length) {
    return infoHash16[0].toUpperCase()
  } else {
    var infoHash32 = this.match(/([2-7A-Z]{32})/) // extract base32 infoHash
    if (infoHash32 && infoHash32.length) {
      return ('0'.repeat(40) + basex16.encode(basex32.decode(infoHash32[0]))).slice(-40) // convert to base16 infohash (may need padding with zeroes to length 40)
    } else {
      return null // infoHash not found in String.
    }
  }
}

/**
 * extend the String object to add the replaceInfoHash method
 * if the String contains a base16 infoHash then return the String with the infoHash in UpperCase.
 * if the String contains a base32 infoHash then replace it with the base16 equivalent.
 */
String.prototype.replaceInfoHash = function() {
  var infoHash16 = this.match(/([0-9A-Fa-f]{40})/) // extract base16 infoHash
  if (infoHash16 && infoHash16.length) {
    return this.replace(infoHash16[0], infoHash16[0].toUpperCase()) // replace base16 with upperCase
  } else {
    var infoHash32 = this.match(/([2-7A-Z]{32})/) // extract base32 infoHash
    if (infoHash32 && infoHash32.length) {
      return this.replace(infoHash32[0], ('0'.repeat(40) + basex16.encode(basex32.decode(infoHash32[0]))).slice(-40)) // convert base32 to base16 infohash (may need padding with zeroes to length 40) and replace it in String
    } else {
      return this.toString() // infoHash not found in String
    }
  }
}

/**
 * extend the Number object to add the minsToDhm method
 * converts numerical total minutes to a "days hours:minutes" string
 */
Number.prototype.minsToDhm = function() {
  var days = parseInt(this / (60 * 24))
  var hours = parseInt(this / 60) % 24
  var minutes = parseInt(this) % 60
  return days + ' ' + ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2)
}

/**
 * extend the String object to add the dhmToMins method
 * converts a "days hours:minutes" string to numerical total minutes
 */
String.prototype.dhmToMins = function() {
  var dhmPart = this.split(/[\s:]+/, 3)
  if (dhmPart.length === 3) {
    return parseInt(dhmPart[0] * 24 * 60) + parseInt(dhmPart[1] * 60) + parseInt(dhmPart[2])
  } else {
    return undefined
  }
}

window.debugTSE = (localStorage.getItem('debugTSE'))
window.debugTraktTVv2 = (localStorage.getItem('debugTraktTVv2'))

/**
 * drop bebasRegular fontFamily if user enabled mixedCase
 */
if (localStorage.getItem('font.bebas.disabled')) {
  var elemStyle = document.createElement('style')
  elemStyle.id = 'bebas-override'
  elemStyle.innerHTML = [
    'h1, h2, h3, strong, .inline-checkbox label, sidepanel .buttons .torrent-mini-remote-control>span, .settings .buttons .btn {',
    'font-family: helvetica, sans-serif !important;',
    '}',
    'strong {',
    'font-weight: bold !important;',
    '}',
    'strong, sidepanel .buttons .torrent-mini-remote-control> span, sidepanel .buttons strong {',
    'letter-spacing: normal !important;',
    '}'
  ].join(' ')
  document.body.insertBefore(elemStyle, document.body.firstChild)
}
