import {Metadata} from 'di'
const fs = require('mz/fs');
import * as nodePath from 'path'

import co from './co'
export var Promise: PromiseConstructor = require('native-or-bluebird');

/**
 * Check if `obj` is yieldable (via co)
 */
export function isYieldable (obj:any): boolean {
  return isPromise(obj) || isGenerator(obj) || isGeneratorFunction(obj);
}

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
export function isPromise(obj:any): boolean {
  return 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
export function isGenerator(obj:any): boolean {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
export function isGeneratorFunction(obj:any): boolean {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}


export function camelize(str:string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index == 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export function requireDir(path:string, iterator:any, ctx:any): Promise<void> {
  
  return co(function *() {
    
    let fullPath = nodePath.resolve(path)
    
    let files = yield fs.readdir(path)
    files.sort();
    for (let i=0,ii=files.length;i<ii;i++) {
      let file = files[i];
      
      let ext = nodePath.extname(file);
      
      if (!~['.js'].indexOf(ext)) continue;
      
      file = nodePath.join(fullPath, file)
      let data
      try {
        data = require(file);  
      } catch (e) {
       
        continue
      }
      
      
      
      if (isGenerator(iterator) || isGeneratorFunction(iterator)) {
        yield iterator.call(ctx, data, file)  
      } else {
        
        let ret = iterator.call(ctx, data, file);
        
        if (ret && isYieldable(ret)) {
          yield ret
        }
        
      }
    }
    
  });
  
}

export function callFunc(fn:Function, ctx?:any, args:any[] = []) {
    
    return co(function *() {
       if (isGenerator(fn) || isGeneratorFunction(fn)) {
         return yield _call(fn,ctx,args);
       } else {
         
         let ret = _call(fn,ctx,args);
         if (!ret) return;
         if (ret && ret instanceof Error) {
           throw ret;
         } else if (isYieldable(ret)) {
           return yield ret;
         }
         
         return ret;
       } 
    })
   
    
  }
  
  function _call(fn:Function, ctx?:any, args:any[] = []): any {
    return fn.apply(ctx, args);
  }