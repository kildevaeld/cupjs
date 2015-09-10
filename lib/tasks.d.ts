export interface TasksOptions {
    serial?: boolean;
}
export interface ITask {
    (): Promise<any> | void;
}
export declare class Tasks {
    tasks: ITask[];
    config: TasksOptions;
    constructor(options?: TasksOptions);
    run(iterator?: ((tasks: ITask) => Promise<any> | void) | Iterator<any>, ctx?: any): Promise<any>;
    add(tasks: ITask[] | ITask): Tasks;
    addFromPath(path: string): Promise<Tasks>;
    destroy(): void;
}
