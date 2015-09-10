export interface Cookie {
    set(name: string, value: any, options?: any): any;
    get(name: string, options?: any): any;
}
export interface IContext {
    links(links: any): IContext;
    xhr: boolean;
    body: any;
    render(template: string, locals?: Object): any;
    cookies: Cookie;
    throw(msg?: string | number, status?: number | string): any;
}
export declare var Context: IContext;
