export declare class Cache {
    path: string;
    map: Map<string, any>;
    constructor(tmp_path: string);
    set(key: string, value: any): Cache;
    get(key: string): any;
    has(key: string): boolean;
    rm(key: string): Cache;
    save(): Promise<boolean>;
}
