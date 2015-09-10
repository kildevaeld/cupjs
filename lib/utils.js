'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.isYieldable = isYieldable;
exports.isPromise = isPromise;
exports.isGenerator = isGenerator;
exports.isGeneratorFunction = isGeneratorFunction;
exports.camelize = camelize;
exports.requireDir = requireDir;
exports.deferred = deferred;
exports.callFunc = callFunc;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _path = require('path');

var nodePath = _interopRequireWildcard(_path);

var _co = require('./co');

var _co2 = _interopRequireDefault(_co);

var fs = require('mz/fs');
var Promise = require('native-or-bluebird');
exports.Promise = Promise;
/**
 * Check if `obj` is yieldable (via co)
 */

function isYieldable(obj) {
    return isPromise(obj) || isGenerator(obj) || isGeneratorFunction(obj);
}

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isPromise(obj) {
    return 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator(obj) {
    return 'function' == typeof obj.next && 'function' == typeof obj['throw'];
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGeneratorFunction(obj) {
    var constructor = obj.constructor;
    if (!constructor) return false;
    if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
    return isGenerator(constructor.prototype);
}

function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index == 0 ? match.toLowerCase() : match.toUpperCase();
    });
}

function requireDir(path, iterator, ctx) {
    return (0, _co2['default'])(function* () {
        var fullPath = nodePath.resolve(path);
        var files = yield fs.readdir(path);
        files.sort();
        for (var i = 0, ii = files.length; i < ii; i++) {
            var file = files[i];
            var ext = nodePath.extname(file);
            if (! ~['.js'].indexOf(ext)) continue;
            file = nodePath.join(fullPath, file);
            var data = undefined;
            try {
                data = require(file);
            } catch (e) {
                continue;
            }
            if (isGenerator(iterator) || isGeneratorFunction(iterator)) {
                yield iterator.call(ctx, data, file);
            } else {
                var ret = iterator.call(ctx, data, file);
                if (ret && isYieldable(ret)) {
                    yield ret;
                }
            }
        }
    });
}

function deferred() {
    var resolve = undefined,
        reject = undefined,
        promise = new Promise(function (res, rej) {
        resolve = res;
        reject = rej;
    });
    return {
        reject: reject,
        resolve: resolve,
        promise: promise,
        done: function done(err, result) {
            if (err) return reject(err);
            resolve(result);
        }
    };
}

function callFunc(fn, ctx) {
    var args = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

    return (0, _co2['default'])(function* () {
        if (isGenerator(fn) || isGeneratorFunction(fn)) {
            return yield _call(fn, ctx, args);
        } else {
            var ret = _call(fn, ctx, args);
            if (!ret) return;
            if (ret && ret instanceof Error) {
                throw ret;
            } else if (isYieldable(ret)) {
                return yield ret;
            }
            return ret;
        }
    });
}

function _call(fn, ctx) {
    var args = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

    return fn.apply(ctx, args);
}