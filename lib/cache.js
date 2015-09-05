'use strict';
Object.defineProperty(exports, '__esModule', {
    value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _path = require('path');

var nodePath = _interopRequireWildcard(_path);

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

class Cache {
    constructor(tmp_path) {
        this.path = nodePath.join(tmp_path, 'compiled_map.json');
        try {
            var json = require(this.path);
            this.map = new Map(json);
        } catch (e) {
            this.map = new Map();
        }
    }
    set(key, value) {
        this.map.set(key, value);
        return this;
    }
    get(key) {
        return this.map.get(key);
    }
    has(key) {
        return this.get != null;
    }
    rm(key) {
        this.map['delete'](key);
        return this;
    }
    save() {
        var _this = this;

        var out = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = this.map[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _step$value = _slicedToArray(_step.value, 2);

                var key = _step$value[0];
                var value = _step$value[1];

                out.push([key, value]);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return new utils.Promise(function (resolve, reject) {
            fs.writeFile(_this.path, JSON.stringify(out, null, 2), 'utf8', function (err) {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}

exports.Cache = Cache;