'use strict';
Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _koaLibContext = require('koa/lib/context');

var _koaLibContext2 = _interopRequireDefault(_koaLibContext);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var views = require('co-views');
Object.defineProperty(_koaLibContext2['default'], 'isXHR', {
    get: function get() {
        var xhr = this.get('X-Requested-With');
        return xhr === 'XMLHttpRequest';
    }
});
var Context = (0, _objectAssign2['default'])(_koaLibContext2['default'], {
    links: function links(_links) {
        var link = this.response.get('Link') || '';
        if (link) link += ', ';
        return this.response.set('Link', link + Object.keys(_links).map(function (rel) {
            return '<' + _links[rel] + '>; rel="' + rel + '"';
        }).join(', '));
        return this;
    },
    render: function render(template) {
        var locals = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        if (!this.__renderer) {
            if (!this.app.config.paths.views) {
                throw new Error('view directory not set!');
            }
            this.__renderer = views(this.app.config.paths.views);
        }
        var env = process.env.NODE_ENV || 'development';
        return this.__renderer(template, (0, _objectAssign2['default'])({ environment: env }, locals));
    }
});
exports.Context = Context;