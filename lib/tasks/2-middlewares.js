'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = Middlewares;
var body = require('koa-body-parsers'),
    etag = require('koa-etag'),
    conditional = require('koa-conditional-get'),
    method = require('koa-methodoverride'),
    qs = require('koa-qs'),
    assets = require('koa-static');

function* Middlewares(app) {
    body(app);
    app.use(function* (next) {
        this.parseBody = function (type, limit) {
            switch (type || this.is(['json', 'urlencoded'])) {
                case 'json':
                    return this.json(limit);
                case 'urlencoded':
                    return this.urlencoded(limit);
            }
        };
        yield* next;
    });
    app.use(method()).use(etag()).use(conditional()).use(assets('public'));
}

module.exports = exports['default'];