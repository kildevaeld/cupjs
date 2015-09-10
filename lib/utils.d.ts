export declare var Promise: PromiseConstructor;
/**
 * Check if `obj` is yieldable (via co)
 */
export declare function isYieldable(obj: any): boolean;
/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
export declare function isPromise(obj: any): boolean;
/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
export declare function isGenerator(obj: any): boolean;
/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
export declare function isGeneratorFunction(obj: any): boolean;
export declare function camelize(str: string): string;
export declare function requireDir(path: string, iterator: any, ctx: any): Promise<void>;
export interface Deferred {
    reject(err?: Error): any;
    resolve(result?: any): any;
    done(err?: Error, resolve?: any): any;
    promise: Promise;
}
export declare function deferred(): Deferred;
export declare function callFunc(fn: Function, ctx?: any, args?: any[]): Promise<any>;
