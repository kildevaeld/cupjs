'use babel'
import {get} from '../../lib/annotations'


export default class HomeController {

  @get('/');
  * home (ctx) {
    console.log('hello')
    ctx.body = "Hello World"

  }

}