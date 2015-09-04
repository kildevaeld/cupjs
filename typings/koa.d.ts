
// Note: can use any name here, but has to be the same throughout this file


declare module 'koa' {
  
  function koa(name: string): Koa;
  class Koa {
    listen(port:number)
    use(...middlewars:Function[])
  }
  
  interface koa {
    new(awesomeness: number): Koa;
  }  
  
  
  export default Koa
}

declare module 'koa/lib/context' {
  
  function context(name: string): Koa;
  class Koa {
    listen(port:number)
    use(...middlewars:Function[])
  }
  
  interface context {
    new(awesomeness: number): Koa;
  }  
  
  
  export default Context
}