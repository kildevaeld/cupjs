/// <reference path="interfaces" />
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.get = get;
exports.put = put;
exports.post = post;
exports.del = del;
exports.namespace = namespace;
exports.service = service;

var _di = require('di');

var mNamespaceKey = "cupjs:namespace";
exports.mNamespaceKey = mNamespaceKey;
var mRouteKey = "cupjs:route";
exports.mRouteKey = mRouteKey;
var mServiceKey = 'cupjs:service';
exports.mServiceKey = mServiceKey;
function test() {}
if (!test.name) {
    Object.defineProperty(Function.prototype, 'name', {
        get: function get() {
            var name = this.toString().match(/^\s*function\s*(\S*)\s*\(/)[1];
            // For better performance only parse once, and then cache the
            // result through a new accessor for repeated access.
            Object.defineProperty(this, 'name', { value: name });
            return name;
        }
    });
}
function route(method, pattern, middleware) {
    return function (target, key, descriptor) {
        var routes = _di.Metadata.get(mRouteKey, target.constructor) || [];
        var route = { method: method.toUpperCase(), pattern: pattern, action: key };
        route.middlewares = middleware || [];
        routes.push(route);
        _di.Metadata.define(mRouteKey, routes, target.constructor, undefined);
        return null;
    };
}

function get(pattern) {
    for (var _len = arguments.length, midddlewares = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        midddlewares[_key - 1] = arguments[_key];
    }

    return route('GET', pattern, midddlewares);
}

function put(pattern) {
    return route('PUT', pattern);
}

function post(pattern) {
    return route('POST', pattern);
}

function del(pattern) {
    return route('DELETE', pattern);
}

function namespace(pattern) {
    return function (target) {
        _di.Metadata.define(mNamespaceKey, pattern, target, undefined);
        return void 0;
    };
}

function service(name) {
    return function (target) {
        _di.Metadata.define(mServiceKey, name || target.name, target, undefined);
        return void 0;
    };
}