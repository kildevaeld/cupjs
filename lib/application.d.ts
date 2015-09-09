/// <reference path="../typings/tsd.d.ts" />
import { Server } from 'http';
import Koa from 'koa';
import { DIContainer } from 'di';
import { RouteDescription } from './annotations';
export interface ApplicationOptionsPaths {
    controllers?: string;
    initializers?: string;
    routes?: string;
    services?: string;
    views?: string;
    public?: string;
}
export interface ApplicationOptions {
    paths?: ApplicationOptionsPaths;
    services?: {
        [key: string]: any;
    };
}
export declare class Application extends Koa {
    private __initialized;
    private _server;
    private _router;
    private context;
    _container: DIContainer;
    private _serviceActivator;
    config: ApplicationOptions;
    constructor(config?: ApplicationOptions);
    register(name?: string | FunctionConstructor, fn?: FunctionConstructor): Application;
    service<T extends Function>(service: string | T): T;
    registerService(name?: string | Function, fn?: Function): void;
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
    _registerRoutes(fn: Function, routes: RouteDescription[], namespace?: string): void;
    _get_dependencies(fn: Function): Promise<any>;
}
