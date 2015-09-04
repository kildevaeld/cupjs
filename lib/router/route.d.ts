export default class Route {
    params: any;
    name: string;
    methods: string[];
    path: string;
    regexp: RegExp;
    fns: any;
    middleware: Function[];
    /**
    * Initialize a new Route with given `method`, `path`, and `middleware`.
    *
    * @param {String|RegExp} path Path string or regular expression.
    * @param {Array} methods Array of HTTP verbs.
    * @param {Array} middleware Route callback/middleware or series of.
    * @param {String} name Optional.
    * @param {Object=} opts Optional. Passed to `path-to-regexp`.
    * @return {Route}
    * @api private
    */
    constructor(path: any, methods: any, middleware: any, name: any, opts?: {});
    /**
    * Check if given request `path` matches route,
    * and if so populate `route.params`.
    *
    * @param {String} path
    * @return {Array} of matched params or null if not matched
    * @api private
    */
    match(path: any): any[];
    /**
    * Generate URL for route using given `params`.
    *
    * @example
    *
    *   var route = new Route(['GET'], '/users/:id', fn);
    *
    *   route.url({ id: 123 });
    *   // => "/users/123"
    *
    * @param {Object} params url parameters
    * @return {String}
    * @api private
    */
    url(params: any): string;
    /**
    * Run validations on route named parameters.
    *
    * @example
    *
    *   router
    *     .param('user', function *(id, next) {
    *       this.user = users[id];
    *       if (!user) return this.status = 404;
    *       yield next;
    *      })
    *     .get('/users/:user', function *(next) {
    *       this.body = this.user;
    *      });
    *
    * @param {String} param
    * @param {Function *(id, next)} fn
    * @api public
    */
    param(param: any, fn: any): Route;
}
