'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _di = require('di');

var _annotations = require('./annotations');

class ServiceActivator {
    constructor(app) {
        this.app = app;
    }
    resolveDependencies(fn) {
        var service = _di.Metadata.getOwn(_annotations.mServiceKey, fn),
            params = (0, _di.getFunctionParameters)(fn),
            args = new Array(params.length),
            name = service.name;
        var p = undefined,
            i = undefined,
            ii = undefined;
        for (i = 0, ii = args.length; i < ii; i++) {
            p = params[i];
            if (p == 'config') {
                args[i] = this.app.config.services[name] || {};
            } else if (p == 'app') {
                args[i] = this.app;
            } else {
                args[i] = this.app._container.get(p);
            }
        }
        return args;
    }
    invoke(fn, deps, keys) {
        var instance = Reflect.construct(fn, deps);
        if (instance.$instance) {
            instance = instance.$instance;
        }
        return instance;
    }
}

exports['default'] = ServiceActivator;
module.exports = exports['default'];