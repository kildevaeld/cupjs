
/// <reference path="node/node.d.ts" />
/// <reference path="koa.d.ts" />
/// <reference path="debug/debug.d.ts" />
/// <reference path="co.d.ts" />

declare module 'methods' {	
	var Methods: string[]
	export default Methods
}


declare module 'object-assign' {
	function assign(...args:any[]): any
	export default assign
}

declare module 'koa-compose' {
	function compose(...args:any[]): any
	export default compose
}

declare module 'native-or-bluebird' {
	
}