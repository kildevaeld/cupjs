'use strict';
Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _koaCompose = require('koa-compose');

var _koaCompose2 = _interopRequireDefault(_koaCompose);

var _pathToRegexp = require('path-to-regexp');

var _pathToRegexp2 = _interopRequireDefault(_pathToRegexp);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var debug = (0, _debug2['default'])('mvc:router:route');

class Route {
    /**
    * Initialize a new Route with given `method`, `path`, and `middleware`.
    *
    * @param {String|RegExp} path Path string or regular expression.
    * @param {Array} methods Array of HTTP verbs.
    * @param {Array} middleware Route callback/middleware or series of.
    * @param {String} name Optional.
    * @param {Object=} opts Optional. Passed to `path-to-regexp`.
    * @return {Route}
    * @api private
    */
    constructor(path, methods, middleware, name) {
        var opts = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

        this.name = name || null;
        this.methods = [];
        methods.forEach(function (method) {
            this.methods.push(method.toUpperCase());
        }, this);
        this.params = [];
        this.fns = {
            params: {},
            middleware: []
        };
        if (path instanceof RegExp) {
            this.path = path.source;
            this.regexp = path;
        } else {
            this.path = path;
            this.regexp = (0, _pathToRegexp2['default'])(path, this.params, opts);
        }
        // ensure middleware is a function
        middleware.forEach(function (fn) {
            var type = typeof fn;
            if (type != 'function') {
                throw new Error(methods.toString() + " `" + (name || path) + "`: `middleware` " + "must be a function, not `" + type + "`");
            }
        });
        if (middleware.length > 1) {
            this.middleware = (0, _koaCompose2['default'])(middleware);
        } else {
            this.middleware = middleware[0];
        }
        this.fns.middleware = middleware;
        debug('defined route %s %s', this.methods, this.path);
    }
    /**
    * Check if given request `path` matches route,
    * and if so populate `route.params`.
    *
    * @param {String} path
    * @return {Array} of matched params or null if not matched
    * @api private
    */
    match(path) {
        if (this.regexp.test(path)) {
            var params = [];
            var captures = [];
            // save route capture groups
            var matches = path.match(this.regexp);
            if (matches && matches.length > 0) {
                captures = matches.slice(1);
            }
            if (this.params.length) {
                // If route has parameterized capture groups,
                // use parameter names for properties
                for (var len = captures.length, i = 0; i < len; i++) {
                    if (this.params[i]) {
                        var c = captures[i];
                        params[this.params[i].name] = c ? safeDecodeURIComponent(c) : c;
                    }
                }
            } else {
                for (var i = 0, len = captures.length; i < len; i++) {
                    var c = captures[i];
                    params[i] = c ? safeDecodeURIComponent(c) : c;
                }
            }
            return params;
        }
        return null;
    }
    /**
    * Generate URL for route using given `params`.
    *
    * @example
    *
    *   var route = new Route(['GET'], '/users/:id', fn);
    *
    *   route.url({ id: 123 });
    *   // => "/users/123"
    *
    * @param {Object} params url parameters
    * @return {String}
    * @api private
    */
    url(params) {
        var args = params;
        var url = this.path;
        // argument is of form { key: val }
        if (typeof params != 'object') {
            args = Array.prototype.slice.call(arguments);
        }
        if (args instanceof Array) {
            for (var len = args.length, i = 0; i < len; i++) {
                url = url.replace(/:[^\/]+/, args[i]);
            }
        } else {
            for (var key in args) {
                url = url.replace(':' + key, args[key]);
            }
        }
        url.split('/').forEach(function (component) {
            url = url.replace(component, encodeURIComponent(component));
        });
        return url;
    }
    /**
    * Run validations on route named parameters.
    *
    * @example
    *
    *   router
    *     .param('user', function *(id, next) {
    *       this.user = users[id];
    *       if (!user) return this.status = 404;
    *       yield next;
    *      })
    *     .get('/users/:user', function *(next) {
    *       this.body = this.user;
    *      });
    *
    * @param {String} param
    * @param {Function *(id, next)} fn
    * @api public
    */
    param(param, fn) {
        var middleware = [];
        this.fns.params[param] = function* (next) {
            yield* fn.call(this, this.params[param], next);
        };
        this.params.forEach(function (param) {
            var fn = this.fns.params[param.name];
            if (fn) {
                middleware.push(fn);
            }
        }, this);
        this.middleware = (0, _koaCompose2['default'])(middleware.concat(this.fns.middleware));
        return this;
    }
}

/**
* Safe decodeURIComponent, won't throw any error.
* If `decodeURIComponent` error happen, just return the original value.
*
* @param {String} text
* @return {String} URL decode original string.
*/
exports['default'] = Route;
function safeDecodeURIComponent(text) {
    try {
        return decodeURIComponent(text);
    } catch (e) {
        return text;
    }
}
module.exports = exports['default'];