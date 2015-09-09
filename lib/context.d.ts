export interface IContext {
    links(links: any): IContext;
    xhr: boolean;
    body: any;
    render(template: string, locals?: Object): any;
}
export declare var Context: IContext;
