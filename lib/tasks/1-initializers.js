'use strict';

var _tasks = require('../tasks');

var _utils = require('../utils');

module.exports = function* Initializers(app) {
    var ff = _utils.callFunc;
    var initializersPath = app.config.initializers;
    if (!initializersPath) return;
    var task = new _tasks.Tasks({ serial: true });
    yield task.addFromPath(initializersPath);
    yield task.run(function* (t) {
        var deps = yield app._get_dependencies(t);
        return yield (0, _utils.callFunc)(t, app, deps);
    });
};