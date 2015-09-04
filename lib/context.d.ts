export interface IContext {
    links(links: any): IContext;
    xhr: boolean;
    body: any;
}
export declare var Context: IContext;
