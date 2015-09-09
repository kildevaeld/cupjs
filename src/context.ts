
'use strict';
/// <reference path="../typings/tsd.d.ts" />
import context from 'koa/lib/context';
import assign from 'object-assign';
import {Readable} from 'stream'
import aassign from 'object-assign'

const views = require('co-views');


Object.defineProperty(context, 'isXHR', {
  get: function () {
    let xhr = this.get('X-Requested-With');
    return xhr === 'XMLHttpRequest';
  }
});

export interface IContext {
  links(links): IContext
  xhr:boolean
  body:any
  render(template:string,locals?:Object): any
}

export var Context : IContext = assign(context, {
  links: function(links){
    var link = this.response.get('Link') || '';
    if (link) link += ', ';
    return this.response.set('Link', link + Object.keys(links).map(function(rel){
      return '<' + links[rel] + '>; rel="' + rel + '"';
    }).join(', '));
    return this
  },

  render: function (template:string, locals:Object = {}) {
      if (!this.__renderer) {

        if (!this.app.config.paths.views) {
            throw new Error('view directory not set!');
        }
        this.__renderer = views(this.app.config.paths.views);
      }

      let env = process.env.NODE_ENV || 'development';
      return this.__renderer(template, assign({ environment: env }, locals));
  }

});
