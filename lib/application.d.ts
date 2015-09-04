/// <reference path="../typings/tsd.d.ts" />
import { Server } from 'http';
import Koa from 'koa';
import { RouteDescription } from './annotations';
export interface ControllerOptions {
    controllers?: string;
    initializers?: string;
    routes?: string;
    services?: string;
}
export declare class Application extends Koa {
    private __initialized;
    private _server;
    private _router;
    private _context;
    private _container;
    config: ControllerOptions;
    constructor(config?: ControllerOptions);
    register(fn: FunctionConstructor): Application;
    service<T extends Function>(service: string | T): T;
    /**
     * Use middlewares
     * @param  {...Function} middleware One or more middleware functions
     * @return {JaffaMVC}   This for chaining.
     * @memberOf JaffaMVC#
     * @method use
     */
    use(...middleware: any[]): Application;
    run(port: number): Promise<Application>;
    listen(port: number, force?: boolean): Server;
    _registerRoutes(fn: Function, routes: RouteDescription[]): void;
    _get_dependencies(fn: Function): Promise<any>;
}
