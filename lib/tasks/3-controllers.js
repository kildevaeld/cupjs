'use strict';

var _tasks = require('../tasks');

module.exports = function* Controllers(app) {
    var controllerPath = app.config.controllers;
    if (!controllerPath) return;
    var task = new _tasks.Tasks({ serial: false });
    yield task.addFromPath(controllerPath);
    yield task.run(function (c) {
        app.register(c);
        return Promise.resolve();
    });
};