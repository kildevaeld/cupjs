/// <reference path="../typings/tsd.d.ts" />
import * as utils from './utils'
import {Server} from 'http'
import Koa from 'koa'
import co from './co'
import {toPromise,isPromise} from './co'
import {Context,IContext} from './context'
import compose from 'koa-compose'
import {Router} from './router/index'
import {Metadata, DIContainer, getFunctionParameters} from 'di'
import {mRouteKey,mServiceKey,RouteDescription,mNamespaceKey} from './annotations'

import {Tasks, ITask} from './tasks'

const checkReg = /request|req|ctx|context|response|res/i

export interface ApplicationOptionsPaths {
  controllers?:string
  initializers?:string
  routes?:string
  services?:string
}

export interface ApplicationOptions {
  paths?: ApplicationOptionsPaths,
  services?: {[key: string]: any}
}

class ServiceActivator {
  app: Application
  constructor(app:Application) {
    this.app = app
  }

  resolveDependencies(fn:Function): any[] {
    let name = <any>Metadata.getOwn(mServiceKey, fn),
      params = getFunctionParameters(fn),
      args = new Array(params.length)
    let p
    for (let i=0,ii=args.length;i<ii;i++) {
      p = params[i]
      if (p == 'config') {
        args[i] = this.app.config.services[name]||{}
      } else {
        args[i] = this.app._container.get(p)
      }

    }

    return args
  }

  invoke(fn:any, deps:any[], keys?:any[]): any {
    console.log(deps)
    var instance = new fn(deps);

    if (instance.$instance) {
      instance = instance.$instance
    }

    return instance;
  }
}

export class Application extends Koa {
  private __initialized: boolean
  private _server: Server
  private _router: Router
  private _context: IContext
  _container: DIContainer
  private _serviceActivator: ServiceActivator
  config: ApplicationOptions


  constructor(config:ApplicationOptions = {}) {
    super()
    this._context = Object.create(Context)
    this._router = new Router()
    this._container = new DIContainer();
    if (!config.paths) config.paths = {}
    this.config = config
    this._serviceActivator = new ServiceActivator(this);
  }

  register(name?:string|FunctionConstructor, fn?: FunctionConstructor): Application {

    if (arguments.length === 1) {
      fn = <FunctionConstructor>name;
      name = fn.name;
    }

    if (typeof fn !== 'function') {
      throw new Error('alredy function can be registered');
    }

    let service = <any>Metadata.getOwn(mServiceKey, fn)


    if (service) {

      this.registerService(service||name, fn)

    }

    let routes = <RouteDescription[]>Metadata.getOwn(mRouteKey, fn)
    let namespace = <string>Metadata.getOwn(mNamespaceKey, fn)
    if (routes) {
      this._registerRoutes(fn, routes, namespace);
      delete (<any>fn).__metadata__.undefined[mRouteKey]
    }



    return this

  }

  service<T extends Function>(service:string|T): T {

    if (typeof service == 'function') {
      service = utils.camelize((<any>service).name)
    }

    return this._container.get(service);
  }

  registerService(name?:string|Function, fn?:Function) {
    if (arguments.length === 1) {
      fn = <Function>name;
      name = fn.name;
    }
    name = utils.camelize(<string>name)
    Metadata.define(mServiceKey, name, fn, undefined)
    Metadata.define((<any>Metadata).instanceActivator, this._serviceActivator,fn, undefined)
    Metadata.define((<any>Metadata).dependencyResolver, this._serviceActivator, fn,undefined)
    this._container.registerSingleton(name, fn)
  }

  /**
   * Use middlewares
   * @param  {...Function} middleware One or more middleware functions
   * @return {JaffaMVC}   This for chaining.
   * @memberOf JaffaMVC#
   * @method use
   */
  use(...middleware): Application {

    if (middleware.length == 1) {
      [middleware] = middleware;
    } else {
      middleware = compose(middleware);
    }

    super.use(<any>middleware);

    return this;
  }

  run(port: number): Promise<Application> {
    if (this.__initialized)
      return Promise.resolve(this);

    var self = this

    return co(function *() {

      let tasks = new Tasks({serial:true})
      yield tasks.addFromPath(__dirname + '/tasks')

      var err
      yield tasks.run( function *(task) {

         yield task(self)
      }).catch( e => {

        err = e;
      })
      //console.log(err)
      if (err != null) throw new Error(err);
      //yield defaultBoot.call(self);

      //self.emit('before:start');

      //yield self.boot();

      self.__initialized = true;

      self.use(self._router.middleware());

      //self.emit('start');

      if (port) {
        self.listen(port);
      }

      return self;

    });


  }


  listen(port: number, force: boolean = false): Server {
    if (!this.__initialized && !force)
      throw new Error('application not initialized, you should call start!');

    if (!this.__initialized)
      console.warn('listen: application not initialized');

    //this.emit('before:listen', port);

    if (this._server) {
      this._server.listen(port);
    } else {
      this._server = super.listen(port);
    }

    //this.emit('listen', port);

    return this._server;
  }


  _registerRoutes(fn:Function, routes:RouteDescription[], namespace?:string) {

    let router = this._router

    if (namespace && namespace != "" && namespace != '/') {
      router = this._router.namespace(namespace, null);
    }

    for (let i = 0, ii = routes.length; i < ii; i++) {
        let route = routes[i];
        let name = (fn.name || route.pattern + ':' + route.action).toLowerCase()
        var self = this;



        let middlewares = route.middlewares.concat([function *(next) {
          let controller = self._container.get(fn)


          const func = controller[route.action]


          if (func == null) throw new Error(`controller '${name}' does not have a method called: '${route.action}'`)

          let keys = getFunctionParameters(func);

          keys = keys.map( x => {
            if (checkReg.test(x)) {
              return this
            } else if (x == 'next') {
              return next
            } else if (x == 'params'|| x == 'parameters') {
              return this.params
            } else {

              return self.service(x);
            }
          })

          if (func && (utils.isGenerator(func) || utils.isGeneratorFunction(func))) {
            return yield func.apply(controller,keys);
          }

          let ret = func.apply(controller, keys);

          if (ret && utils.isYieldable(ret)) {
            return yield ret;
          }

          //return ret;
        }]);

        router.register(name, route.pattern, [route.method], ...middlewares);
      }
  }

  _get_dependencies (fn:Function): Promise<any> {

    let keys = getFunctionParameters(fn);

    keys = keys.map( k => {


      let dep = this._container.get(k);

      if (dep && typeof dep.run === 'function') {
        return dep.run().then( x => dep);
      }

      return dep;
    });

    return toPromise(keys)

  }

}
