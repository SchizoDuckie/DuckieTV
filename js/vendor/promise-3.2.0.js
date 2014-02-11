(function(e) {
  if ("function" == typeof bootstrap) bootstrap("promise", e);
  else if ("object" == typeof exports) module.exports = e();
  else if ("function" == typeof define && define.amd) define(e);
  else if ("undefined" != typeof ses) {
    if (!ses.ok()) return;
    ses.makePromise = e
  } else "undefined" != typeof window ? window.Promise = e() : global.Promise = e()
})(function() {
  var define, ses, bootstrap, module, exports;
  return (function(e, t, n) {
    function i(n, s) {
      if (!t[n]) {
        if (!e[n]) {
          var o = typeof require == "function" && require;
          if (!s && o) return o(n, !0);
          if (r) return r(n, !0);
          throw new Error("Cannot find module '" + n + "'")
        }
        var u = t[n] = {
          exports: {}
        };
        e[n][0].call(u.exports, function(t) {
          var r = e[n][1][t];
          return i(r ? r : t)
        }, u, u.exports)
      }
      return t[n].exports
    }
    var r = typeof require == "function" && require;
    for (var s = 0; s < n.length; s++) i(n[s]);
    return i
  })({
    1: [function(require, module, exports) {
      // shim for using process in browser
      var process = module.exports = {};

      process.nextTick = (function() {
        var canSetImmediate = typeof window !== 'undefined' && window.setImmediate;
        var canPost = typeof window !== 'undefined' && window.postMessage && window.addEventListener;

        if (canSetImmediate) {
          return function(f) {
            return window.setImmediate(f)
          };
        }

        if (canPost) {
          var queue = [];
          window.addEventListener('message', function(ev) {
            if (ev.source === window && ev.data === 'process-tick') {
              ev.stopPropagation();
              if (queue.length > 0) {
                var fn = queue.shift();
                fn();
              }
            }
          }, true);

          return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
          };
        }

        return function nextTick(fn) {
          setTimeout(fn, 0);
        };
      })();

      process.title = 'browser';
      process.browser = true;
      process.env = {};
      process.argv = [];

      process.binding = function(name) {
        throw new Error('process.binding is not supported');
      }

      // TODO(shtylman)
      process.cwd = function() {
        return '/'
      };
      process.chdir = function(dir) {
        throw new Error('process.chdir is not supported');
      };

    }, {}],
    2: [function(require, module, exports) {
      'use strict'

      var nextTick = require('./lib/next-tick')

      module.exports = Promise

      function Promise(fn) {
        if (!(this instanceof Promise)) return new Promise(fn)
        if (typeof fn !== 'function') throw new TypeError('not a function')
        var state = null
        var delegating = false
        var value = null
        var deferreds = []
        var self = this

        this.then = function(onFulfilled, onRejected) {
            return new Promise(function(resolve, reject) {
              handle(new Handler(onFulfilled, onRejected, resolve, reject))
            })
          }

        function handle(deferred) {
          if (state === null) {
            deferreds.push(deferred)
            return
          }
          nextTick(function() {
            var cb = state ? deferred.onFulfilled : deferred.onRejected
            if (cb === null) {
              (state ? deferred.resolve : deferred.reject)(value)
              return
            }
            var ret
            try {
              ret = cb(value)
            } catch (e) {
              deferred.reject(e)
              return
            }
            deferred.resolve(ret)
          })
        }

        function resolve(newValue) {
          if (delegating) return
          resolve_(newValue)
        }

        function resolve_(newValue) {
          if (state !== null) return
          try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
            if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.')
            if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
              var then = newValue.then
              if (typeof then === 'function') {
                delegating = true
                then.call(newValue, resolve_, reject_)
                return
              }
            }
            state = true
            value = newValue
            finale()
          } catch (e) {
            reject_(e)
          }
        }

        function reject(newValue) {
          if (delegating) return
          reject_(newValue)
        }

        function reject_(newValue) {
          if (state !== null) return
          state = false
          value = newValue
          finale()
        }

        function finale() {
          for (var i = 0, len = deferreds.length; i < len; i++)
          handle(deferreds[i])
          deferreds = null
        }

        try {
          fn(resolve, reject)
        } catch (e) {
          reject(e)
        }
      }


      function Handler(onFulfilled, onRejected, resolve, reject) {
        this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
        this.onRejected = typeof onRejected === 'function' ? onRejected : null
        this.resolve = resolve
        this.reject = reject
      }

    }, {
      "./lib/next-tick": 4
    }],
    3: [function(require, module, exports) {
      'use strict'

      //This file contains then/promise specific extensions to the core promise API
      var Promise = require('./core.js')
      var nextTick = require('./lib/next-tick')

      module.exports = Promise

      /* Static Functions */

      Promise.from = function(value) {
          if (value instanceof Promise) return value
          return new Promise(function(resolve) {
            resolve(value)
          })
        }
      Promise.denodeify = function(fn) {
        return function() {
          var self = this
          var args = Array.prototype.slice.call(arguments)
          return new Promise(function(resolve, reject) {
            args.push(function(err, res) {
              if (err) reject(err)
              else resolve(res)
            })
            fn.apply(self, args)
          })
        }
      }
      Promise.nodeify = function(fn) {
        return function() {
          var args = Array.prototype.slice.call(arguments)
          var callback = typeof args[args.length - 1] === 'function' ? args.pop() : null
          try {
            return fn.apply(this, arguments).nodeify(callback)
          } catch (ex) {
            if (callback == null) {
              return new Promise(function(resolve, reject) {
                reject(ex)
              })
            } else {
              nextTick(function() {
                callback(ex)
              })
            }
          }
        }
      }

      Promise.all = function() {
        var args = Array.prototype.slice.call(arguments.length === 1 && Array.isArray(arguments[0]) ? arguments[0] : arguments)

        return new Promise(function(resolve, reject) {
          if (args.length === 0) return resolve([])
          var remaining = args.length

          function res(i, val) {
            try {
              if (val && (typeof val === 'object' || typeof val === 'function')) {
                var then = val.then
                if (typeof then === 'function') {
                  then.call(val, function(val) {
                    res(i, val)
                  }, reject)
                  return
                }
              }
              args[i] = val
              if (--remaining === 0) {
                resolve(args);
              }
            } catch (ex) {
              reject(ex)
            }
          }
          for (var i = 0; i < args.length; i++) {
            res(i, args[i])
          }
        })
      }

      /* Prototype Methods */

      Promise.prototype.done = function(onFulfilled, onRejected) {
        var self = arguments.length ? this.then.apply(this, arguments) : this
        self.then(null, function(err) {
          nextTick(function() {
            throw err
          })
        })
      }
      Promise.prototype.nodeify = function(callback) {
        if (callback == null) return this

        this.then(function(value) {
          nextTick(function() {
            callback(null, value)
          })
        }, function(err) {
          nextTick(function() {
            callback(err)
          })
        })
      }
    }, {
      "./core.js": 2,
      "./lib/next-tick": 4
    }],
    4: [function(require, module, exports) {
      (function(process) {
        'use strict'

        if (typeof setImmediate === 'function') { // IE >= 10 & node.js >= 0.10
          module.exports = function(fn) {
            setImmediate(fn)
          }
        } else if (typeof process !== 'undefined' && process && typeof process.nextTick === 'function') { // node.js before 0.10
          module.exports = function(fn) {
            process.nextTick(fn)
          }
        } else {
          module.exports = function(fn) {
            setTimeout(fn, 0)
          }
        }

      })(require("__browserify_process"))
    }, {
      "__browserify_process": 1
    }]
  }, {}, [3])(3)
});;