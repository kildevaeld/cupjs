import {Application} from '../application'
import * as NodePath from 'path'
import {Tasks} from '../tasks'

module.exports = function *Controllers (app:Application) {

  let controllerPath = app.config.paths.controllers

  if (!controllerPath) return

  let task = new Tasks({serial:false})

  yield task.addFromPath(controllerPath);
  
  yield task.run( c => {

    app.register(c)
    return Promise.resolve();
  }).catch( (e) => {
    console.log(e)
  })


}