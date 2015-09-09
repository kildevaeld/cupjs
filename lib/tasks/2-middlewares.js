'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = Middlewares;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _path = require('path');

var nodePath = _interopRequireWildcard(_path);

var body = require('koa-body-parsers'),
    etag = require('koa-etag'),
    conditional = require('koa-conditional-get'),
    method = require('koa-methodoverride'),
    qs = require('koa-qs'),
    render = require('co-views'),
    assets = require('koa-static');

function* Middlewares(app) {
    body(app);
    app.context.parseBody = function (type, limit) {
        switch (type || this.is(['json', 'urlencoded'])) {
            case 'json':
                return this.json(limit);
            case 'urlencoded':
                return this.urlencoded(limit);
        }
    };
    app.use(method()).use(etag()).use(conditional());
    var path = app.config.paths['public'];
    if (path) {
        path = nodePath.resolve(path);
        path.use(assets(path, { defer: true }));
    }
}

module.exports = exports['default'];