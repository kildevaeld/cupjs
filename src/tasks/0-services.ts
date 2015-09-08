import {Application} from '../application'
import * as NodePath from 'path'
import {Tasks} from '../tasks'
import {callFunc} from '../utils'
//import {Metadata} from 'di'
//import {mServiceKey} from '../annotations'

const Metadata = require('di').Metadata,
  mServiceKey = require('../annotations').mServiceKey

export default function *Services(app:Application) {

  let ff = callFunc;
  let servicesPath = app.config.services

  if (!servicesPath) return

  let task = new Tasks({serial:false})

  yield task.addFromPath(servicesPath);


  yield task.run( function * (t) {

    /*if (typeof t !== 'function') {
      t = () => { return t };
    }*/

    let sk
    try {
        sk = Metadata.getOwn(mServiceKey, t)
    } catch (e) {
      console.log(e)
    }


    if (!sk) {
        Metadata.define(mServiceKey, t.name, t, undefined)
    }

    app.register(<any>t);
  
  })

}
