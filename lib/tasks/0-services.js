'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = Services;

var _tasks = require('../tasks');

var _utils = require('../utils');

//import {Metadata} from 'di'
//import {mServiceKey} from '../annotations'
var Metadata = require('di').Metadata,
    mServiceKey = require('../annotations').mServiceKey;

function* Services(app) {
    var ff = _utils.callFunc;
    var servicesPath = app.config.services;
    if (!servicesPath) return;
    var task = new _tasks.Tasks({ serial: false });
    yield task.addFromPath(servicesPath);
    yield task.run(function* (t) {
        /*if (typeof t !== 'function') {
          t = () => { return t };
        }*/
        var sk = undefined;
        try {
            sk = Metadata.getOwn(mServiceKey, t);
        } catch (e) {
            console.log(e);
        }
        if (!sk) {
            Metadata.define(mServiceKey, t.name, t, undefined);
        }
        app.register(t);
    });
}

module.exports = exports['default'];