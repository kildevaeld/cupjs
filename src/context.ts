
'use strict';
/// <reference path="../typings/tsd.d.ts" />
import context from 'koa/lib/context';
import assign from 'object-assign';
import {Readable} from 'stream'



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
} 

export var Context : IContext = assign(context, {
  links: function(links){
    var link = this.response.get('Link') || '';
    if (link) link += ', ';
    return this.response.set('Link', link + Object.keys(links).map(function(rel){
      return '<' + links[rel] + '>; rel="' + rel + '"';
    }).join(', '));
    return this
  }

});
