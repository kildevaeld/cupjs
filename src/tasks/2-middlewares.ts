/// <reference path="../interfaces" />
import {Application} from '../application'
const body = require('koa-body-parsers'),
	etag = require('koa-etag'),
	conditional = require('koa-conditional-get'),
	method = require('koa-methodoverride'),
	qs = require('koa-qs'),
	assets = require('koa-static');

export default function *Middlewares (app:Application) {
	
	body(app);
	
	app.use(function *(next) {
		this.parseBody = function (type?:string, limit?:number) {
			switch (type||this.is(['json', 'urlencoded'])) {
        case 'json':
          return this.json(limit);
        case 'urlencoded':
          return this.urlencoded(limit);
      }
		}
		
		yield *next;
	})
	
	
	app.use(method())
	.use(etag())
	.use(conditional())
	.use(assets('public'))
}