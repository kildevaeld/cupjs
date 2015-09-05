'use strict';

import * as nodePath from 'path'
import * as utils from './utils'
import * as fs from 'fs'

export class Cache {
  path:string
  map: Map<string, any>

  constructor (tmp_path:string) {
    this.path = nodePath.join(tmp_path,'compiled_map.json');

    try {
      let json = require(this.path);

      this.map = new Map<string,any>(json)
    } catch (e) {
      this.map = new Map<string,any>()
    }
  }

  set(key:string, value:any): Cache {
    this.map.set(key, value);
    return this
  }

  get(key:string):any {
    return this.map.get(key)
  }

  has(key:string): boolean {
    return this.get != null;
  }

  rm(key:string): Cache {
    this.map.delete(key);
    return this
  }

  save(): Promise<boolean> {
     let out: any = []

     for (let [key ,value] of this.map) {
       out.push([key, value])
     }

     return new utils.Promise((resolve, reject) => {

       fs.writeFile(this.path, JSON.stringify(out, null, 2), 'utf8', function (err) {
         if (err) return reject(err)
         resolve()
       })

     })

  }

}