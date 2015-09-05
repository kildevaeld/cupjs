/// <reference path="interfaces" />

import {Metadata, DIContainer} from 'di'

export const mRouteKey = "cupjs:route"
export const mServiceKey = 'cupjs:service'

function test(){}
if (!test.name) {
	Object.defineProperty(Function.prototype, 'name', {
    get: function() {

      var name = this.toString().match(/^\s*function\s*(\S*)\s*\(/)[1];
      // For better performance only parse once, and then cache the
      // result through a new accessor for repeated access.
      Object.defineProperty(this, 'name', { value: name });
      return name;
    }
  });
}

export interface RouteDescription {
	method:string
	pattern:string|RegExp
	action:string
	middlewares?:any[]
}

function route (method:string, pattern:string|RegExp, middleware?:GeneratorFunction[]): MethodDecorator {
	return function<T extends Function>(target:Function, key:string, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T> | void {

		let routes = <RouteDescription[]>Metadata.get(mRouteKey, target.constructor)||[];
		let route : RouteDescription = {method:method.toUpperCase(), pattern:pattern, action:key}
		route.middlewares = middleware||[];

		routes.push(<any>route);
		Metadata.define(mRouteKey, routes, target.constructor, undefined)


		return null
	}
}

export function get(pattern:string|RegExp, ...midddlewares:Function[]): MethodDecorator {
	return route('GET', pattern, midddlewares);
}

export function put(pattern:string|RegExp): MethodDecorator {
	return route('PUT', pattern);
}

export function post(pattern:string|RegExp): MethodDecorator {
	return route('POST', pattern);
}

export function del(pattern:string|RegExp): MethodDecorator {
	return route('DELETE', pattern);
}

export function service(name?:string): ClassDecorator {
	return function <TFunction extends Function>(target: TFunction): TFunction | void {
		Metadata.define(mServiceKey, name||target.name, target, undefined)
		return void 0
	}
}