/// <reference path="interfaces" />
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopExportWildcard(obj, defaults) { var newObj = defaults({}, obj); delete newObj['default']; return newObj; }

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

var _application = require('./application');

_defaults(exports, _interopExportWildcard(_application, _defaults));

var _annotations = require('./annotations');

_defaults(exports, _interopExportWildcard(_annotations, _defaults));

var _context = require('./context');

Object.defineProperty(exports, 'Context', {
  enumerable: true,
  get: function get() {
    return _context.Context;
  }
});

var _tasks = require('./tasks');

Object.defineProperty(exports, 'Tasks', {
  enumerable: true,
  get: function get() {
    return _tasks.Tasks;
  }
});

var _di = require('di');

Object.defineProperty(exports, 'transient', {
  enumerable: true,
  get: function get() {
    return _di.transient;
  }
});
Object.defineProperty(exports, 'inject', {
  enumerable: true,
  get: function get() {
    return _di.inject;
  }
});
Object.defineProperty(exports, 'autoinject', {
  enumerable: true,
  get: function get() {
    return _di.autoinject;
  }
});
Object.defineProperty(exports, 'Metadata', {
  enumerable: true,
  get: function get() {
    return _di.Metadata;
  }
});