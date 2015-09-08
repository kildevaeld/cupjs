/// <reference path="../../typings/tsd.d.ts" />
"use strict";
Object.defineProperty(exports, '__esModule', {
    value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _methods = require('methods');

var _methods2 = _interopRequireDefault(_methods);

var _koaCompose = require('koa-compose');

var _koaCompose2 = _interopRequireDefault(_koaCompose);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _events = require('events');

var _url = require('url');

var URL = _interopRequireWildcard(_url);

var _route = require('./route');

var _route2 = _interopRequireDefault(_route);

var debug = (0, _debug2['default'])('mvc:router:route');
function* noop() {}

class Router extends _events.EventEmitter {
    //rootPath: string
    /**
     * Router
     * @param {Router} [parent]
     * @param {Object} options
     * @param {String} [options.rootPath]
     * @extends EventEmitter
     */
    constructor(parent) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        super();
        if (arguments.length === 2) {
            this.parent = parent;
        } else if (parent instanceof Router) {
            this.parent = parent;
        } else {
            options = parent || {};
        }
        // Namespaces
        this._ns = {};
        this.config = options;
        //this.methods = ["OPTIONS"];
        this._routes = [];
        //this.params = {};
        this.rootPath = options.rootPath || '/';
    }
    middleware() {
        var router = this;
        return function* (next) {
            var routes = router._routes,
                i = routes.length;
            if (!(this.params instanceof Array)) {
                this.params = [];
            }
            var prev = next || noop,
                route = undefined,
                params = undefined;
            var pathname = this.path;
            var pn = router.qualifiedPath === '/' ? pathname : pathname.replace(router.qualifiedPath, '');
            while (i--) {
                route = routes[i];
                if (route instanceof _route2['default']) {
                    params = route.match(pn);
                    if (params && ~route.methods.indexOf(this.method)) {
                        debug("%s %s", this.method, pathname);
                        this.route = route;
                        merge(this.params, params);
                        prev = route.middleware.call(this, prev);
                    }
                } else if (route instanceof Router) {
                    if (route._match(pn)) {
                        debug('router: %s', pathname);
                        prev = route.middleware().call(this, prev);
                    }
                } else {
                    prev = route.call(this, prev);
                }
            }
            yield* prev;
        };
    }
    /**
     * Register route with all methods.
     *
     * @param {String} name Optional.
     * @param {String|RegExp} path
     * @param {Function} middleware You may also pass multiple middleware.
     * @return {Route}
     * @api public
     */
    all(name, path, middleware) {
        var args = Array.prototype.slice.call(arguments);
        args.splice(typeof path == 'function' ? 1 : 2, 0, _methods2['default']);
        this.register.apply(this, args);
        return this;
    }
    /**
     * Redirect `path` to `destination` URL with optional 30x status `code`.
     *
     * @param {String} source URL, RegExp, or route name.
     * @param {String} destination URL or route name.
     * @param {Number} code HTTP status code (default: 301).
     * @return {Route}
     * @api public
     */
    redirect(source, destination, code) {
        // lookup source route by name
        if (source instanceof RegExp || source[0] != '/') {
            source = this.url(source);
        }
        // lookup destination route by name
        if (destination instanceof RegExp || destination[0] != '/') {
            destination = this.url(destination);
        }
        return this.all(source, function* () {
            this.redirect(destination);
            this.status = code || 301;
        });
    }
    /**
     * Create and register a route.
     *
     * @param {String} name Optional.
     * @param {String|RegExp} path Path string or regular expression.
     * @param {Array} methods Array of HTTP verbs.
     * @param {Function|Array<Function>} middleware Multiple middleware also accepted.
     * @return {Route}
     * @api public
     */
    register(name, path, methods) {
        for (var _len = arguments.length, middleware = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
            middleware[_key - 3] = arguments[_key];
        }

        if (path instanceof Array) {
            middleware = Array.prototype.slice.call(arguments, 2);
            methods = path;
            path = name;
            name = null;
        } else {
            middleware = Array.prototype.slice.call(arguments, 3);
        }
        // create route
        var route = new _route2['default'](path, methods, middleware, name, this.config);
        // add parameter middleware
        /*Object.keys(this.params).forEach(function(param) {
          route.param(param, this.params[param]);
        }, this);*/
        // register route with router
        // DEBUG: this.routes.push(route);
        // register route methods with router (for 501 responses)
        /*route.methods.forEach(function(method) {
          if (!~this.methods.indexOf(method)) {
            this.methods.push(method);
          }
        }, this);*/
        var router = this;
        router._cache = router._cache || {};
        this.emit('route:register', {
            router: this,
            route: route
        });
        this.use(route);
        return route;
    }
    unregister(path, methods) {
        if (methods && !Array.isArray(methods)) methods = [methods];
        var routes = this._routes,
            route,
            i;
        for (i = 0; i < routes.length; i++) {
            route = routes[i];
            if (route.path !== path) continue;
            if (methods) {
                for (var x = 0; x < methods.length; x++) {
                    var met = methods[x];
                    var index = route.methods.indexOf(met);
                    if (index > -1) {
                        route.methods.splice(index, 1);
                    }
                }
            } else {
                var index = this._routes.indexOf(route);
                this.emit('route:unregister', {
                    router: this,
                    route: route
                });
                this._routes = this._routes.splice(index, 1);
            }
        }
    }
    use() {
        for (var _len2 = arguments.length, middleware = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            middleware[_key2] = arguments[_key2];
        }

        if (middleware.length > 1) {
            middleware = (0, _koaCompose2['default'])(middleware);
        } else {
            var _middleware = middleware;

            var _middleware2 = _slicedToArray(_middleware, 1);

            middleware = _middleware2[0];
        }
        this._routes.push(middleware);
        return this;
    }
    namespace(path, fn) {
        var ns = undefined;
        if (this._ns[path]) {
            ns = this._ns[path];
        } else {
            var o = (0, _objectAssign2['default'])({}, this.config, { rootPath: path });
            ns = new Router(this, o);
            this.use(ns);
        }
        if (typeof fn === 'function') {
            fn.call(ns);
        }
        return ns;
    }
    /**
     * Lookup route with given `name`.
     *
     * @param {String} name
     * @return {Route|false}
     * @api public
     */
    route(name) {
        for (var len = this._routes.length, i = 0; i < len; i++) {
            if (this._routes[i].name == name) {
                return this._routes[i];
            }
        }
        return null;
    }
    /**
     * Generate URL for route using given `params`.
     *
     * @param {String} name route name
     * @param {Object} params url parameters
     * @return {String|Error}
     * @api public
     */
    url(name) {
        var route = this.route(name);
        if (route) {
            for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                args[_key3 - 1] = arguments[_key3];
            }

            return route.url.apply(route, args);
        }
        return new Error("No route found for name: " + name);
    }
    /*param (param, fn) {
      this.params[param] = fn;
      this._routes.forEach(function(route) {
        route.param(param, fn);
      });
      return this;
    }
       _match (path) {
      return this._regexp.test(path);
    }*/
    get rootPath() {
        return this._rootPath;
    }
    set rootPath(path) {
        if (path == null) {
            throw new Error('Cannot set path of null');
        }
        if (path.substr(0, 1) !== '/') {
            path = '/' + path;
        }
        this._rootPath = path;
        this._regexp = new RegExp('^\\' + this.qualifiedPath + ".*");
    }
    get qualifiedPath() {
        if (this.parent) {
            return URL.resolve(this.parent.qualifiedPath, this.rootPath);
        }
        return this.rootPath;
    }
    _match(path) {
        return this._regexp.test(path);
    }
}

/**
 * Create `router.verb()` methods, where *verb* is one of the HTTP verbes such
 * as `router.get()` or `router.post()`.
 */
exports.Router = Router;
_methods2['default'].forEach(function (method) {
    Router.prototype[method] = function (name, path, middleware) {
        var args = Array.prototype.slice.call(arguments);
        if (typeof path === 'string' || path instanceof RegExp) {
            args.splice(2, 0, [method]);
        } else {
            args.splice(1, 0, [method]);
        }
        this.register.apply(this, args);
        return this;
    };
});
/**
 * Merge b into a.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */
function merge(a, b) {
    if (!b) {
        return a;
    }
    for (var k in b) a[k] = b[k];
    return a;
}