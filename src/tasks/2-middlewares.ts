/// <reference path="../interfaces" />
import {Application} from '../application'
import * as nodePath from 'path'
const body = require('koa-body-parsers'),
	etag = require('koa-etag'),
	conditional = require('koa-conditional-get'),
	method = require('koa-methodoverride'),
	qs = require('koa-qs'),
	assets = require('koa-static');

export default function *Middlewares (app:Application) {

	body(app);

	app.context.parseBody = function (type?:string, limit?:number) {
			switch (type||this.is(['json', 'urlencoded'])) {
        case 'json':
          return this.json(limit);
        case 'urlencoded':
          return this.urlencoded(limit);
      }
		};


	app.use(method())
	.use(etag())
	.use(conditional())

	let path = app.config.public

	if (path) {
		path = nodePath.resolve(path);
		path.use(assets(path, {defer:true}))
	}


}