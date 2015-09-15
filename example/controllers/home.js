'use babel'

import {get} from '../../lib/annotations'


export default class HomeController {

  @get('/');
  * home (ctx) {

    ctx.body = "Hello World"

  }

}