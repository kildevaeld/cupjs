'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

var _koa = require('koa');

var _koa2 = _interopRequireDefault(_koa);

var _co = require('./co');

var _co2 = _interopRequireDefault(_co);

var _context = require('./context');

var _koaCompose = require('koa-compose');

var _koaCompose2 = _interopRequireDefault(_koaCompose);

var _routerIndex = require('./router/index');

var _di = require('di');

var _annotations = require('./annotations');

var _tasks = require('./tasks');

var checkReg = /request|req|ctx|context|response|res/i;
class ServiceActivator {
    constructor(app) {
        this.app = app;
    }
    resolveDependencies(fn) {
        var name = _di.Metadata.getOwn(_annotations.mServiceKey, fn),
            params = (0, _di.getFunctionParameters)(fn),
            args = new Array(params.length);
        var p = undefined;
        for (var i = 0, ii = args.length; i < ii; i++) {
            p = params[i];
            if (p == 'config') {
                args[i] = this.app.config.services[name] || {};
            } else {
                args[i] = this.app._container.get(p);
            }
        }
        return args;
    }
    invoke(fn, deps, keys) {
        console.log(deps);
        var instance = new fn(deps);
        if (instance.$instance) {
            instance = instance.$instance;
        }
        return instance;
    }
}

class Application extends _koa2['default'] {
    constructor() {
        var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        super();
        this._context = Object.create(_context.Context);
        this._router = new _routerIndex.Router();
        this._container = new _di.DIContainer();
        if (!config.paths) config.paths = {};
        this.config = config;
        this._serviceActivator = new ServiceActivator(this);
    }
    register(name, fn) {
        if (arguments.length === 1) {
            fn = name;
            name = fn.name;
        }
        if (typeof fn !== 'function') {
            throw new Error('alredy function can be registered');
        }
        var service = _di.Metadata.getOwn(_annotations.mServiceKey, fn);
        if (service) {
            this.registerService(service || name, fn);
        }
        var routes = _di.Metadata.getOwn(_annotations.mRouteKey, fn);
        var namespace = _di.Metadata.getOwn(_annotations.mNamespaceKey, fn);
        if (routes) {
            this._registerRoutes(fn, routes, namespace);
            delete fn.__metadata__.undefined[_annotations.mRouteKey];
        }
        return this;
    }
    service(service) {
        if (typeof service == 'function') {
            service = utils.camelize(service.name);
        }
        return this._container.get(service);
    }
    registerService(name, fn) {
        if (arguments.length === 1) {
            fn = name;
            name = fn.name;
        }
        name = utils.camelize(name);
        _di.Metadata.define(_annotations.mServiceKey, name, fn, undefined);
        _di.Metadata.define(_di.Metadata.instanceActivator, this._serviceActivator, fn, undefined);
        _di.Metadata.define(_di.Metadata.dependencyResolver, this._serviceActivator, fn, undefined);
        this._container.registerSingleton(name, fn);
    }
    /**
     * Use middlewares
     * @param  {...Function} middleware One or more middleware functions
     * @return {JaffaMVC}   This for chaining.
     * @memberOf JaffaMVC#
     * @method use
     */
    use() {
        for (var _len = arguments.length, middleware = Array(_len), _key = 0; _key < _len; _key++) {
            middleware[_key] = arguments[_key];
        }

        if (middleware.length == 1) {
            var _middleware = middleware;

            var _middleware2 = _slicedToArray(_middleware, 1);

            middleware = _middleware2[0];
        } else {
            middleware = (0, _koaCompose2['default'])(middleware);
        }
        super.use(middleware);
        return this;
    }
    run(port) {
        if (this.__initialized) return Promise.resolve(this);
        var self = this;
        return (0, _co2['default'])(function* () {
            var tasks = new _tasks.Tasks({ serial: true });
            yield tasks.addFromPath(__dirname + '/tasks');
            var err;
            yield tasks.run(function* (task) {
                yield task(self);
            })['catch'](function (e) {
                err = e;
            });
            //console.log(err)
            if (err != null) throw new Error(err);
            //yield defaultBoot.call(self);
            //self.emit('before:start');
            //yield self.boot();
            self.__initialized = true;
            self.use(self._router.middleware());
            //self.emit('start');
            if (port) {
                self.listen(port);
            }
            return self;
        });
    }
    listen(port) {
        var force = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        if (!this.__initialized && !force) throw new Error('application not initialized, you should call start!');
        if (!this.__initialized) console.warn('listen: application not initialized');
        //this.emit('before:listen', port);
        if (this._server) {
            this._server.listen(port);
        } else {
            this._server = super.listen(port);
        }
        //this.emit('listen', port);
        return this._server;
    }
    _registerRoutes(fn, routes, namespace) {
        var _this = this;

        var router = this._router;
        if (namespace && namespace != "" && namespace != '/') {
            router = this._router.namespace(namespace, null);
        }

        var _loop = function (i, ii) {
            var _router;

            var route = routes[i];
            var name = (fn.name || route.pattern + ':' + route.action).toLowerCase();
            self = _this;

            var middlewares = route.middlewares.concat([function* (next) {
                var _this2 = this;

                var controller = self._container.get(fn);
                var func = controller[route.action];
                if (func == null) throw new Error('controller \'' + name + '\' does not have a method called: \'' + route.action + '\'');
                var keys = (0, _di.getFunctionParameters)(func);
                keys = keys.map(function (x) {
                    if (checkReg.test(x)) {
                        return _this2;
                    } else if (x == 'next') {
                        return next;
                    } else if (x == 'params' || x == 'parameters') {
                        return _this2.params;
                    } else {
                        return self.service(x);
                    }
                });
                if (func && (utils.isGenerator(func) || utils.isGeneratorFunction(func))) {
                    return yield func.apply(controller, keys);
                }
                var ret = func.apply(controller, keys);
                if (ret && utils.isYieldable(ret)) {
                    return yield ret;
                }
                //return ret;
            }]);
            (_router = router).register.apply(_router, [name, route.pattern, [route.method]].concat(_toConsumableArray(middlewares)));
        };

        for (var i = 0, ii = routes.length; i < ii; i++) {
            var self;

            _loop(i, ii);
        }
    }
    _get_dependencies(fn) {
        var _this3 = this;

        var keys = (0, _di.getFunctionParameters)(fn);
        keys = keys.map(function (k) {
            var dep = _this3._container.get(k);
            if (dep && typeof dep.run === 'function') {
                return dep.run().then(function (x) {
                    return dep;
                });
            }
            return dep;
        });
        return (0, _co.toPromise)(keys);
    }
}

exports.Application = Application;