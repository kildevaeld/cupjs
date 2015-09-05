import {Application} from '../application'
import * as NodePath from 'path'
import {Tasks} from '../tasks'
import {callFunc} from '../utils'

module.exports = function *Initializers(app:Application) {

  let ff = callFunc;
  let initializersPath = app.config.initializers

  if (!initializersPath) return

  let task = new Tasks({serial:true})

  yield task.addFromPath(initializersPath);


  yield task.run( function * (t) {

    let deps =  yield app._get_dependencies(t);

    return yield callFunc(t,app,deps);
  })

}