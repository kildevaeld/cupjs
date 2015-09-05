import {Application} from '../application'
import * as NodePath from 'path'
import {Tasks} from '../tasks'
import {callFunc} from '../utils'
module.exports = function *Services(app:Application) {

  let ff = callFunc;
  let servicesPath = app.config.services

  if (!servicesPath) return

  let task = new Tasks({serial:false})

  yield task.addFromPath(servicesPath);


  yield task.run( function * (t) {

    if (typeof t !== 'function') {
      t = () => { return t };
    }

    app.registerService(t);

  })

}