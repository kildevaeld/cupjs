/// <reference path="interfaces" />
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _co = require('./co');

var _co2 = _interopRequireDefault(_co);

var _path = require('path');

var nodePath = _interopRequireWildcard(_path);

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

var _babelCore = require('babel-core');

var babel = _interopRequireWildcard(_babelCore);

var _typescript = require('typescript');

var tsc = _interopRequireWildcard(_typescript);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _cache = require('./cache');

var fs = require('mz/fs');

var debug = (0, _debug2['default'])('cupjs:tasks');
;

class Tasks {
    constructor() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        this.tasks = [];
        this.config = options;
        this.config.serial = options.serial || false;
    }
    run(iterator) {
        var ctx = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];

        var self = this,
            i,
            ii,
            tasks = this.tasks,
            task,
            ret,
            serial = this.config.serial;
        return (0, _co2['default'])(function* () {
            var results = [];
            var queue = [],
                ret = undefined;
            for (i = 0, ii = tasks.length; i < ii; i++) {
                task = tasks[i];
                if (iterator) {
                    ret = utils.callFunc(iterator, ctx, [task]);
                } else {
                    ret = utils.callFunc(task, ctx);
                }
                serial ? results.push((yield ret)) : queue.push(ret);
            }
            if (!serial) return yield queue;
            return results;
        });
    }
    add(tasks) {
        if (!Array.isArray(tasks)) {
            tasks = [tasks];
        }
        this.tasks = this.tasks.concat(tasks);
        return this;
    }
    addFromPath(path) {
        var self = this;
        return (0, _co2['default'])(function* () {
            path = nodePath.resolve(path);
            var files = yield fs.readdir(path);
            files.sort();
            var file = undefined,
                i = undefined,
                ii = undefined,
                ext = undefined,
                basename = undefined,
                ffile = undefined;
            for (i = 0, ii = files.length; i < ii; i++) {
                file = files[i];
                ffile = nodePath.join(path, file);
                var fChar = file.charAt(0);
                if (!! ~['_', '.'].indexOf(fChar)) {
                    continue;
                }
                var data = yield resolveFile(ffile);
                if (data == null) continue;
                if (typeof data === 'function') {
                    self.tasks.push(data);
                } else if (Object == data.constructor) {
                    for (var k in data) {
                        if (typeof data[k] === 'function') {
                            self.tasks.push(data[k]);
                        }
                    }
                }
            }
        });
    }
    destroy() {
        this.tasks = void 0;
    }
}

exports.Tasks = Tasks;

var cache = new _cache.Cache(nodePath.join(process.cwd(), '.tmp'));
var md5File = require('md5-file');
function md5Sum(path) {
    return new utils.Promise(function (resolve, reject) {
        md5File(path, function (err, sum) {
            if (err) return reject(err);
            resolve(sum);
        });
    });
}
function* resolveFile(path) {
    var ext = nodePath.extname(path);
    var basename = nodePath.basename(path, ext);
    var dirname = nodePath.dirname(path);
    var compileit = null;
    if (!! ~['.coffee', '.ts'].indexOf(ext)) {
        compileit = ext.substr(1) === 'ts' ? 'typescript' : 'coffeescript';
    } else if (ext == '.js' || ext == '.es6') {
        var firstline = yield readFirstLine(path);
        if (/^'use babel'/.test(firstline)) {
            compileit = 'babel';
        }
    }
    // Just regular javascript
    if (compileit === null) {
        return require(path);
    }
    if (/\.d.ts$/.test(path)) return null;
    // check if compiled file already exists and is update to date
    var md5 = yield md5Sum(path);
    var tmpFile = nodePath.join(dirname, "." + basename + '.compiled.js');
    if (yield fs.exists(tmpFile)) {
        if (md5 === cache.get(path)) {
            return require(tmpFile);
        }
    }
    var code = null;
    switch (compileit) {
        case 'babel':
            code = yield compileBabelFile(path);
            break;
        case 'typescript':
            code = yield compileTypescript(path);
            break;
        case 'coffeescript':
            break;
    }
    if (code == null) {
        throw new Error('could not compile file ' + path);
    }
    yield fs.writeFile(tmpFile, code);
    cache.set(path, md5);
    yield cache.save();
    return require(tmpFile);
}
function* compileBabel(data) {
    debug('use babel');
    var result = babel.transform(data, {
        optional: ['es7.decorators'],
        blacklist: ['regenerator']
    });
    return result.code;
}
function* compileBabelFile(path) {
    var data = yield fs.readFile(path, 'utf8');
    var str = yield compileBabel(data);
    return str;
}
function* compileTypescript(path) {
    var data = yield fs.readFile(path, 'utf8');
    var result = tsc.transpile(data, {
        experimentalDecorators: true,
        target: tsc.ScriptTarget.ES6
    });
    return compileBabel(result);
}
function readFirstLine(path) {
    return (0, _co2['default'])(function* () {
        var fd = yield fs.open(path, 'r');
        var line = "",
            buffer = new Buffer(1),
            i = 0;
        while (true) {
            var read = fs.readSync(fd, buffer, 0, 1);
            if (read <= 0) {
                break;
            }
            if (buffer.toString() == '\n') break;
            line += buffer.toString();
        }
        yield fs.close(fd);
        return line;
    });
}