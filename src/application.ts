/// <reference path="../typings/tsd.d.ts" />
import * as utils from './utils'
import {Server} from 'http'
import Koa from 'koa'
import co from './co'
import {toPromise} from './co'
import {Context,IContext} from './context'
import compose from 'koa-compose'
import {Router} from './router/index'
import {Metadata, DIContainer, getFunctionParameters} from 'di'
import {mRouteKey,mServiceKey,RouteDescription} from './annotations'

import {Tasks, ITask} from './tasks'

export interface ControllerOptions {
  controllers?:string
  initializers?:string
  routes?:string
  services?:string
}

export class Application extends Koa {
  private __initialized: boolean
  private _server: Server
  private _router: Router
  private _context: IContext
  private _container: DIContainer
  config: ControllerOptions

  constructor(config:ControllerOptions = {}) {
    super()
    this._context = Object.create(Context)
    this._router = new Router()
    this._container = new DIContainer();
    this.config = config
  }

  register(fn: FunctionConstructor): Application {

    let routes = <RouteDescription[]>Metadata.getOwn(mRouteKey, fn)

    if (routes) {
      this._registerRoutes(fn, routes);
      delete <any>fn.__metadata__[undefined][mRouteKey]
    }

    let service = <any>Metadata.getOwn(mServiceKey, fn)

    if (service) {
      let name = utils.camelize(fn.name)

      this._container.registerSingleton(name, fn)

    }

    return this

  }

  service<T extends Function>(service:string|T): T {

    if (typeof service == 'function') {
      service = utils.camelize((<any>service).name)
    }

    return this._container.get(service);
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


    return co(function *() {

      let tasks = new Tasks({serial:true})
      yield tasks.addFromPath(__dirname + '/tasks')

      var self = this
      yield tasks.run( function *(task) {
         yield task(self)
      })

      //yield defaultBoot.call(this);

      //this.emit('before:start');

      //yield this.boot();

      this.__initialized = true;

      this.use(this._router.middleware());

      //this.emit('start');

      if (port) {
        this.listen(port);
      }

      return this;

    }.bind(this));


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


  _registerRoutes(fn:Function, routes:RouteDescription[]) {
    for (let i = 0, ii = routes.length; i < ii; i++) {
        let route = routes[i];
        let name = (fn.name || route.pattern + ':' + route.action).toLowerCase()
        var self = this;



        let middlewares = route.middlewares.concat([function *(next) {
          let controller = self._container.get(fn)

          console.log('he')
          const func = controller[route.action]

          if (func == null) throw new Error(`controller '${name}' does not have a method called: '${route.action}'`)

          let keys = getFunctionParameters(func);

          keys = keys.map( x => {
            if (/request|req|ctx|context|response|res/i.test(x)) {
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

        this._router.register(name, route.pattern, [route.method], ...middlewares);
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
