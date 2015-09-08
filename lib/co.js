'use strict';
Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = co;
exports.toPromise = toPromise;
exports.arrayToPromise = arrayToPromise;
exports.objectToPromise = objectToPromise;
exports.isPromise = isPromise;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

/**
 * slice() reference.
 */
var slice = Array.prototype.slice;
/**
 * Expose `co`.
 */
/**
 * Wrap the given generator `fn` into a
 * function that returns a promise.
 * This is a separate function so that
 * every `co()` call doesn't create a new,
 * unnecessary closure.
 *
 * @param {GeneratorFunction} fn
 * @return {Function}
 * @api public
 */
co.wrap = function (fn) {
    /* jshint validthis:true */
    createPromise.__generatorFunction__ = fn;
    return createPromise;
    function createPromise() {
        return co.call(this, fn.apply(this, arguments));
    }
};
/**
 * Execute the generator function or a generator
 * and return a promise.
 *
 * @param {Function} fn
 * @return {Promise}
 * @api public
 */

function co(gen) {
    /* jshint validthis:true */
    var ctx = this;
    // we wrap everything in a promise to avoid promise chaining,
    // which leads to memory leak errors.
    // see https://github.com/tj/co/issues/180
    return new utils.Promise(function (resolve, reject) {
        if (typeof gen === 'function') gen = gen.call(ctx);
        if (!gen || typeof gen.next !== 'function') return resolve(gen);
        onFulfilled();
        /**
         * @param {Mixed} res
         * @return {Promise}
         * @api private
         */
        function onFulfilled(res) {
            var ret;
            try {
                ret = gen.next(res);
            } catch (e) {
                return reject(e);
            }
            next(ret);
        }
        /**
         * @param {Error} err
         * @return {Promise}
         * @api private
         */
        function onRejected(err) {
            var ret;
            try {
                ret = gen['throw'](err);
            } catch (e) {
                return reject(e);
            }
            next(ret);
        }
        /**
         * Get the next value in the generator,
         * return a promise.
         *
         * @param {Object} ret
         * @return {Promise}
         * @api private
         */
        function next(ret) {
            if (ret.done) return resolve(ret.value);
            var value = toPromise.call(ctx, ret.value);
            if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
            return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, ' + 'but the following object was passed: "' + String(ret.value) + '"'));
        }
    });
}

/**
 * Convert a `yield`ed value into a promise.
 *
 * @param {Mixed} obj
 * @return {Promise}
 * @api private
 */

function toPromise(obj) {
    /* jshint validthis:true */
    if (!obj) return Promise.resolve(obj);
    if (isPromise(obj)) return obj;
    if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
    if ('function' == typeof obj) return thunkToPromise.call(this, obj);
    if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
    if (isObject(obj)) return objectToPromise.call(this, obj);
    return Promise.resolve(obj);
}

/**
 * Convert a thunk to a promise.
 *
 * @param {Function}
 * @return {Promise}
 * @api private
 */
function thunkToPromise(fn) {
    /* jshint validthis:true */
    var ctx = this;
    return new utils.Promise(function (resolve, reject) {
        fn.call(ctx, function (err, res) {
            if (err) return reject(err);
            if (arguments.length > 2) res = slice.call(arguments, 1);
            resolve(res);
        });
    });
}
/**
 * Convert an array of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Array} obj
 * @return {Promise}
 * @api private
 */

function arrayToPromise(obj) {
    /* jshint validthis:true */
    return utils.Promise.all(obj.map(toPromise, this));
}

/**
 * Convert an object of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Object} obj
 * @return {Promise}
 * @api private
 */

function objectToPromise(obj) {
    /* jshint validthis:true */
    var results = new obj.constructor();
    var keys = Object.keys(obj);
    var promises = [];
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var promise = toPromise.call(this, obj[key]);
        if (promise && isPromise(promise)) defer(promise, key);else results[key] = obj[key];
    }
    return utils.Promise.all(promises).then(function () {
        return results;
    });
    function defer(promise, key) {
        // predefine the key in the result
        results[key] = undefined;
        promises.push(promise.then(function (res) {
            results[key] = res;
        }));
    }
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
/**
 * Check for plain object.
 *
 * @param {Mixed} val
 * @return {Boolean}
 * @api private
 */
function isObject(val) {
    return Object == val.constructor;
}