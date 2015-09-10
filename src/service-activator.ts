
import {Application} from './application'
import {Metadata, getFunctionParameters} from 'di'
import {mServiceKey} from './annotations'

export default class ServiceActivator {
  app: Application
  constructor(app:Application) {
    this.app = app
  }

  resolveDependencies(fn:Function): any[] {
    let service = <any>Metadata.getOwn(mServiceKey, fn),
      params = getFunctionParameters(fn),
      args = new Array(params.length),
      name = service.name;
    
    let p, i, ii
    
    for (i=0,ii=args.length;i<ii;i++) {
      p = params[i]
      if (p == 'config') {
        args[i] = this.app.config.services[name]||{}
      } else if (p == 'app') {
        args[i] = this.app
      } else {
        args[i] = this.app._container.get(p)
      }

    }

    return args
  }

  invoke(fn:any, deps:any[], keys?:any[]): any {

    var instance = Reflect.construct(fn, deps)

    if (instance.$instance) {
      instance = instance.$instance
    }

    return instance;
  }
}