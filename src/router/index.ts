/// <reference path="../../typings/tsd.d.ts" />


"use strict";

import dbg from 'debug';
import methods from 'methods';

import compose from 'koa-compose';
import assign from 'object-assign';
import {EventEmitter} from 'events';
import * as URL from 'url';
import Route from './route'

let debug = dbg('mvc:router:route');

function *noop() {}

export interface RouterOptions {
  rootPath?:string
}

export class Router extends EventEmitter {
  parent: Router
  config: RouterOptions
  private _routes: Route[]
  private _cache: {[key:string]: any}
  private _ns:{[key: string]: Router}
  private _rootPath: string
  private _regexp: RegExp
  //rootPath: string
  /**
   * Router
   * @param {Router} [parent]
   * @param {Object} options
   * @param {String} [options.rootPath]
   * @extends EventEmitter
   */
  constructor (parent?:Router|RouterOptions, options: RouterOptions={}) {
    super();
    if (arguments.length === 2) {
      this.parent = <Router>parent;
    } else if (parent instanceof Router) {
      this.parent = parent;
    } else  {
      options = parent || {};
    }

    

    // Namespaces
    this._ns = {};

    this.config = options;
    //this.methods = ["OPTIONS"];

    this._routes = [];
    //this.params = {};

    this.rootPath = options.rootPath || '/';
  }

  middleware () {

    const router = this;

    return function* (next) {
      let routes = router._routes,
          i = routes.length;

      if (!(this.params instanceof Array)) {
        this.params = [];
      }

      let prev = next || noop, route, params;

      let pathname = this.path;

      let pn = router.qualifiedPath === '/' ? pathname :
        pathname.replace(router.qualifiedPath, '');

      while (i--) {
        route = routes[i];

        if (route instanceof Route) {

          params = route.match(pn);

          if (params && ~route.methods.indexOf(this.method)) {

            debug("%s %s", this.method, pathname);

            this.route = route;
            merge(this.params, params);

            prev = route.middleware.call(this, prev);
          }

        } else if (route instanceof Router) {
          if (route._match(pn)) {
            debug('router: %s', pathname);
            prev = route.middleware().call(this, prev);
          }
        } else {
          prev = route.call(this, prev);
        }
      }

      yield* prev;

    };
  }

  /**
   * Register route with all methods.
   *
   * @param {String} name Optional.
   * @param {String|RegExp} path
   * @param {Function} middleware You may also pass multiple middleware.
   * @return {Route}
   * @api public
   */
  all (name, path, middleware) {
    var args = Array.prototype.slice.call(arguments);
    args.splice(typeof path == 'function' ? 1 : 2, 0, methods);
    this.register.apply(this, args);
    return this;
  }

  /**
   * Redirect `path` to `destination` URL with optional 30x status `code`.
   *
   * @param {String} source URL, RegExp, or route name.
   * @param {String} destination URL or route name.
   * @param {Number} code HTTP status code (default: 301).
   * @return {Route}
   * @api public
   */
  redirect (source, destination, code) {
    // lookup source route by name
    if (source instanceof RegExp || source[0] != '/') {
      source = this.url(source);
    }

    // lookup destination route by name
    if (destination instanceof RegExp || destination[0] != '/') {
      destination = this.url(destination);
    }

    return this.all(source, function*() {
      this.redirect(destination);
      this.status = code || 301;
    });
  }

  /**
   * Create and register a route.
   *
   * @param {String} name Optional.
   * @param {String|RegExp} path Path string or regular expression.
   * @param {Array} methods Array of HTTP verbs.
   * @param {Function|Array<Function>} middleware Multiple middleware also accepted.
   * @return {Route}
   * @api public
   */
  register (name:string, path:string|RegExp, methods:string[], ...middleware:any[]) {

    if (path instanceof Array) {
      middleware = Array.prototype.slice.call(arguments, 2);
      methods = <string[]>path;
      path = name;
      name = null;
    } else {
      middleware = Array.prototype.slice.call(arguments, 3);
    }

    // create route
    var route = new Route(path, methods, middleware, name, this.config);

    // add parameter middleware
    /*Object.keys(this.params).forEach(function(param) {
      route.param(param, this.params[param]);
    }, this);*/

    // register route with router
    // DEBUG: this.routes.push(route);

    // register route methods with router (for 501 responses)
    /*route.methods.forEach(function(method) {
      if (!~this.methods.indexOf(method)) {
        this.methods.push(method);
      }
    }, this);*/

    var router = this;
    router._cache = router._cache || {};

    this.emit('route:register', {
      router: this,
      route: route
    });


    this.use(route);

    return route;
  }

  unregister (path, methods) {
    if (methods && !Array.isArray(methods))
      methods = [methods];

    var routes = this._routes, route,i;

    for (i = 0; i < routes.length; i++ ) {
      route = routes[i];
      if ( route.path !== path)
        continue;

      if (methods) {
        for (var x=0;x<methods.length;x++) {
          let met = methods[x];
          let index = route.methods.indexOf(met);
          if (index > -1) {
            route.methods.splice(index,1);
          }
        }
      } else {
        let index = this._routes.indexOf(route);
        this.emit('route:unregister', {
          router: this,
          route: route,
        });

        this._routes = this._routes.splice(index,1);
      }
    }

  }

  use (...middleware) {

    if (middleware.length > 1) {
      middleware = compose(middleware);
    } else {
      [middleware] = middleware;
    }
    this._routes.push(<any>middleware);

    return this;
  }

  namespace (path, fn) {
    let ns;


    if (this._ns[path]) {
      ns = this._ns[path];
    } else {
      let o = assign({}, this.config,{rootPath: path});
      ns = new Router(this, o);
      this.use(ns);
    }

    if (typeof fn === 'function') {
      fn.call(ns);
    }

    return ns;
  }
  /**
   * Lookup route with given `name`.
   *
   * @param {String} name
   * @return {Route|false}
   * @api public
   */
  route (name) {
    for (var len = this._routes.length, i = 0; i < len; i++) {
      if (this._routes[i].name == name) {
        return this._routes[i];
      }
    }
    return null;
  }

  /**
   * Generate URL for route using given `params`.
   *
   * @param {String} name route name
   * @param {Object} params url parameters
   * @return {String|Error}
   * @api public
   */
  url (name, ...args) {
    var route = this.route(name);

    if (route) {
      return route.url.apply(route, args);
    }

    return new Error("No route found for name: " + name);
  }

  /*param (param, fn) {
    this.params[param] = fn;
    this._routes.forEach(function(route) {
      route.param(param, fn);
    });
    return this;
  }

  _match (path) {
    return this._regexp.test(path);
  }*/

  get rootPath () { return this._rootPath; }
  set rootPath (path) {

    if (path == null) {
      throw new Error('Cannot set path of null');
    }

    if (path.substr(0,1) !== '/') {
      path = '/' + path;
    }

    this._rootPath = path;
    this._regexp = new RegExp('^\\' + this.qualifiedPath + ".*");
  }
  get qualifiedPath () {
    if (this.parent) {
      return URL.resolve(this.parent.qualifiedPath, this.rootPath);
    }
    return this.rootPath;
  }
}

/**
 * Create `router.verb()` methods, where *verb* is one of the HTTP verbes such
 * as `router.get()` or `router.post()`.
 */

methods.forEach(function(method) {
  Router.prototype[method] = function(name, path, middleware) {
    let args = Array.prototype.slice.call(arguments);
    if ((typeof path === 'string') || (path instanceof RegExp)) {
      args.splice(2, 0, [method]);
    } else {
      args.splice(1, 0, [method]);
    }
    this.register.apply(this, args);
    return this;
  };
});

 /**
  * Merge b into a.
  *
  * @param {Object} a
  * @param {Object} b
  * @return {Object} a
  * @api private
  */

 function merge(a, b) {
   if (!b) {
     return a;
   }for (var k in b) a[k] = b[k];
   return a;
 }
