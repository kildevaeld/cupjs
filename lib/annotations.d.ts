export declare const mRouteKey: string;
export declare const mServiceKey: string;
export interface RouteDescription {
    method: string;
    pattern: string | RegExp;
    action: string;
    middlewares?: any[];
}
export declare function get(pattern: string | RegExp, ...midddlewares: Function[]): MethodDecorator;
export declare function put(pattern: string | RegExp): MethodDecorator;
export declare function post(pattern: string | RegExp): MethodDecorator;
export declare function del(pattern: string | RegExp): MethodDecorator;
export declare function service(): ClassDecorator;
