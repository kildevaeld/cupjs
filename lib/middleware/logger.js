'use strict';
Object.defineProperty(exports, '__esModule', {
    value: true
});

var _util = require('util');

exports['default'] = function () {
    return function* (next) {
        var ss = new Date();
        yield* next;
        var diff = new Date() - ss;
        var req = this.request;
        var str = (0, _util.format)('%s [%s] "%s %s" %s %sms\n', req.ip, ss.toISOString(), req.method, req.originalUrl, this.status, diff);
        process.stdout.write(str);
    };
};

;
module.exports = exports['default'];