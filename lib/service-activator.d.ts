import { Application } from './application';
export default class ServiceActivator {
    app: Application;
    constructor(app: Application);
    resolveDependencies(fn: Function): any[];
    invoke(fn: any, deps: any[], keys?: any[]): any;
}
