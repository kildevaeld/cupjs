/// <reference path="../../typings/tsd.d.ts" />
import { EventEmitter } from 'events';
import Route from './route';
export interface RouterOptions {
    rootPath?: string;
}
export declare class Router extends EventEmitter {
    parent: Router;
    config: RouterOptions;
    private _routes;
    private _cache;
    private _ns;
    private _rootPath;
    private _regexp;
    /**
     * Router
     * @param {Router} [parent]
     * @param {Object} options
     * @param {String} [options.rootPath]
     * @extends EventEmitter
     */
    constructor(parent?: Router | RouterOptions, options?: RouterOptions);
    middleware(): (next: any) => void;
    /**
     * Register route with all methods.
     *
     * @param {String} name Optional.
     * @param {String|RegExp} path
     * @param {Function} middleware You may also pass multiple middleware.
     * @return {Route}
     * @api public
     */
    all(name: any, path: any, middleware: any): Router;
    /**
     * Redirect `path` to `destination` URL with optional 30x status `code`.
     *
     * @param {String} source URL, RegExp, or route name.
     * @param {String} destination URL or route name.
     * @param {Number} code HTTP status code (default: 301).
     * @return {Route}
     * @api public
     */
    redirect(source: any, destination: any, code: any): any;
    /**
     * Create and register a route.
     *
     * @param {String} name Optional.
     * @param {String|RegExp} path Path string or regular expression.
     * @param {Array} methods Array of HTTP verbs.
     * @param {Function|Array<Function>} middleware Multiple middleware also accepted.
     * @return {Route}
     * @api public
     */
    register(name: string, path: string | RegExp, methods: string[], ...middleware: any[]): Route;
    unregister(path: any, methods: any): void;
    use(...middleware: any[]): Router;
    namespace(path: any, fn: any): any;
    /**
     * Lookup route with given `name`.
     *
     * @param {String} name
     * @return {Route|false}
     * @api public
     */
    route(name: any): Route;
    /**
     * Generate URL for route using given `params`.
     *
     * @param {String} name route name
     * @param {Object} params url parameters
     * @return {String|Error}
     * @api public
     */
    url(name: any, ...args: any[]): any;
    rootPath: string;
    qualifiedPath: any;
    _match(path: any): boolean;
}
