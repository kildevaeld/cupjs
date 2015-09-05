'use strict';

var _tasks = require('../tasks');

var _utils = require('../utils');

module.exports = function* Services(app) {
    var ff = _utils.callFunc;
    var servicesPath = app.config.services;
    if (!servicesPath) return;
    var task = new _tasks.Tasks({ serial: false });
    yield task.addFromPath(servicesPath);
    yield task.run(function* (t) {
        if (typeof t !== 'function') {
            t = function () {
                return t;
            };
        }
        app.registerService(t);
    });
};