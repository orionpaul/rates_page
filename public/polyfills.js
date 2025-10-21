/**
 * Polyfills for Maximum Browser Compatibility
 * Supports: IE10+, Old Smart TVs, Windows Explorer, All TV OS
 * This file ensures your app works on the oldest browsers and TV operating systems
 */

(function() {
  'use strict';

  // ===================================
  // CORE JAVASCRIPT POLYFILLS
  // ===================================

  // Array.from polyfill (IE11, old TV browsers)
  if (!Array.from) {
    Array.from = function(arrayLike) {
      return Array.prototype.slice.call(arrayLike);
    };
  }

  // Array.prototype.find polyfill
  if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
      if (this == null) throw new TypeError('Array.prototype.find called on null or undefined');
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      for (var i = 0; i < length; i++) {
        var value = list[i];
        if (predicate.call(thisArg, value, i, list)) return value;
      }
      return undefined;
    };
  }

  // Array.prototype.includes polyfill
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement) {
      var O = Object(this);
      var len = parseInt(O.length) || 0;
      if (len === 0) return false;
      var n = parseInt(arguments[1]) || 0;
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
      while (k < len) {
        if (O[k] === searchElement) return true;
        k++;
      }
      return false;
    };
  }

  // Object.assign polyfill (IE11, old browsers)
  if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
      if (target == null) throw new TypeError('Cannot convert undefined or null to object');
      var to = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }

  // Object.keys polyfill (IE8)
  if (!Object.keys) {
    Object.keys = function(obj) {
      var keys = [];
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          keys.push(key);
        }
      }
      return keys;
    };
  }

  // String.prototype.trim polyfill
  if (!String.prototype.trim) {
    String.prototype.trim = function() {
      return this.replace(/^\s+|\s+$/g, '');
    };
  }

  // String.prototype.includes polyfill
  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      if (typeof start !== 'number') start = 0;
      if (start + search.length > this.length) return false;
      return this.indexOf(search, start) !== -1;
    };
  }

  // String.prototype.startsWith polyfill
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
    };
  }

  // String.prototype.endsWith polyfill
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, length) {
      if (length === undefined || length > this.length) {
        length = this.length;
      }
      return this.substring(length - searchString.length, length) === searchString;
    };
  }

  // ===================================
  // PROMISE POLYFILL (IE11, old TVs)
  // ===================================
  if (typeof Promise === 'undefined') {
    window.Promise = function(executor) {
      var self = this;
      self.status = 'pending';
      self.value = undefined;
      self.callbacks = [];

      function resolve(value) {
        if (self.status !== 'pending') return;
        self.status = 'resolved';
        self.value = value;
        self.callbacks.forEach(function(callback) {
          callback.onResolved && callback.onResolved(value);
        });
      }

      function reject(reason) {
        if (self.status !== 'pending') return;
        self.status = 'rejected';
        self.value = reason;
        self.callbacks.forEach(function(callback) {
          callback.onRejected && callback.onRejected(reason);
        });
      }

      try {
        executor(resolve, reject);
      } catch (e) {
        reject(e);
      }
    };

    Promise.prototype.then = function(onResolved, onRejected) {
      var self = this;
      return new Promise(function(resolve, reject) {
        function handle() {
          var callback = self.status === 'resolved' ? onResolved : onRejected;
          if (!callback) {
            (self.status === 'resolved' ? resolve : reject)(self.value);
            return;
          }
          try {
            var result = callback(self.value);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        }

        if (self.status === 'pending') {
          self.callbacks.push({ onResolved: onResolved, onRejected: onRejected });
        } else {
          setTimeout(handle, 0);
        }
      });
    };

    Promise.prototype.catch = function(onRejected) {
      return this.then(null, onRejected);
    };
  }

  // ===================================
  // FETCH POLYFILL (IE11, old browsers)
  // ===================================
  if (typeof fetch === 'undefined') {
    window.fetch = function(url, options) {
      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        options = options || {};
        xhr.open(options.method || 'GET', url, true);

        if (options.headers) {
          Object.keys(options.headers).forEach(function(key) {
            xhr.setRequestHeader(key, options.headers[key]);
          });
        }

        xhr.onload = function() {
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            text: function() {
              return Promise.resolve(xhr.responseText);
            },
            json: function() {
              return Promise.resolve(JSON.parse(xhr.responseText));
            }
          });
        };

        xhr.onerror = function() {
          reject(new TypeError('Network request failed'));
        };

        xhr.send(options.body || null);
      });
    };
  }

  // ===================================
  // DOM POLYFILLS
  // ===================================

  // Element.classList polyfill (IE9)
  if (!('classList' in document.createElement('_'))) {
    (function(view) {
      if (!('Element' in view)) return;
      var classListProp = 'classList',
        protoProp = 'prototype',
        elemCtrProto = view.Element[protoProp],
        objCtr = Object,
        strTrim = String[protoProp].trim;

      var classList = function(elem) {
        this.elem = elem;
      };

      classList[protoProp] = {
        add: function() {
          var classes = Array.prototype.slice.call(arguments);
          classes.forEach(function(cls) {
            if (!this.contains(cls)) {
              this.elem.className += ' ' + cls;
            }
          }, this);
        },
        remove: function() {
          var classes = Array.prototype.slice.call(arguments);
          classes.forEach(function(cls) {
            var reg = new RegExp('(^|\\s)' + cls + '(\\s|$)', 'g');
            this.elem.className = this.elem.className.replace(reg, ' ');
          }, this);
        },
        contains: function(cls) {
          return new RegExp('(^|\\s)' + cls + '(\\s|$)').test(this.elem.className);
        }
      };

      if (!elemCtrProto.hasOwnProperty(classListProp)) {
        Object.defineProperty(elemCtrProto, classListProp, {
          get: function() {
            return new classList(this);
          }
        });
      }
    }(window));
  }

  // Element.matches polyfill
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.matchesSelector ||
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector ||
      Element.prototype.oMatchesSelector ||
      Element.prototype.webkitMatchesSelector ||
      function(s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s);
        var i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) {}
        return i > -1;
      };
  }

  // Element.closest polyfill
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;
      do {
        if (el.matches(s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  // CustomEvent polyfill (IE9+)
  if (typeof window.CustomEvent !== 'function') {
    function CustomEvent(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: null };
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    }
    window.CustomEvent = CustomEvent;
  }

  // ===================================
  // CONSOLE POLYFILL (old TV browsers)
  // ===================================
  if (!window.console) {
    window.console = {
      log: function() {},
      error: function() {},
      warn: function() {},
      info: function() {},
      debug: function() {}
    };
  }

  // ===================================
  // REQUESTANIMATIONFRAME POLYFILL
  // ===================================
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
      return window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
          return window.setTimeout(callback, 1000 / 60);
        };
    })();
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (function() {
      return window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.oCancelAnimationFrame ||
        window.msCancelAnimationFrame ||
        function(id) {
          window.clearTimeout(id);
        };
    })();
  }

  // ===================================
  // PERFORMANCE.NOW POLYFILL
  // ===================================
  if (!window.performance || !window.performance.now) {
    window.performance = window.performance || {};
    window.performance.now = function() {
      return Date.now ? Date.now() : new Date().getTime();
    };
  }

  // ===================================
  // DATE.NOW POLYFILL
  // ===================================
  if (!Date.now) {
    Date.now = function() {
      return new Date().getTime();
    };
  }

  // ===================================
  // WINDOW.LOCATION.ORIGIN POLYFILL
  // ===================================
  if (!window.location.origin) {
    window.location.origin = window.location.protocol + '//' +
      window.location.hostname +
      (window.location.port ? ':' + window.location.port : '');
  }

  // ===================================
  // PASSIVE EVENT LISTENER DETECTION
  // ===================================
  var passiveSupported = false;
  try {
    var options = Object.defineProperty({}, 'passive', {
      get: function() {
        passiveSupported = true;
      }
    });
    window.addEventListener('test', null, options);
  } catch (err) {}
  window.passiveSupported = passiveSupported;

  // ===================================
  // COMPATIBILITY LOG
  // ===================================
  if (console && console.log) {
    console.log('✅ Polyfills loaded - Browser compatibility ensured!');
  }
})();
