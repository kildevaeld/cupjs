/// <reference path="interfaces" />

const fs = require('mz/fs')
import co from './co'
import * as nodePath from 'path'
import * as utils from './utils'
import * as babel from 'babel-core'
import dbg from 'debug'
import {Cache} from './cache'
const debug = dbg('cupjs:tasks');;

export interface TasksOptions {
  serial?: boolean
}

export interface ITask {
  (): Promise<any>|void
}

export class Tasks {
  tasks: ITask[] = []
  config: TasksOptions
  constructor(options: TasksOptions = {}) {
    this.config = options
    this.config.serial = options.serial || false
  }

  run(iterator?: ((tasks: ITask) => Promise<any>|void) |Iterator<any>, ctx: any = undefined): Promise<any> {

    var self = this, i, ii, tasks = this.tasks, task, ret, serial = this.config.serial

    return co(function *() {
      let results = [];
      let queue = [], ret

      for (i = 0, ii = tasks.length; i < ii; i++) {
        task = tasks[i];

        if (iterator) {
          ret = utils.callFunc(<any>iterator, ctx, [task])

        } else {
          ret = utils.callFunc(task, ctx);
        }
        /*if (serial) {
          
          ret = yield ret
          
          results.push(ret)
        } else {
          
          queue.push(ret);  
        }*/

        serial ? results.push((yield ret)) : queue.push(ret)


      }

      if (!serial) return yield queue

      return results
    });




  }

  add(tasks: ITask[]|ITask): Tasks {

    if (!Array.isArray(tasks)) {
      tasks = [<ITask>tasks]
    }
    this.tasks = this.tasks.concat(<ITask[]>tasks)
    return this
  }



  addFromPath(path: string): Promise<Tasks> {
    var self = this;

    return co(function *() {
      path = nodePath.resolve(path)
      let files = yield fs.readdir(path)
      files.sort()

      let file, i, ii, ext, basename, ffile;
      for (i = 0, ii = files.length; i < ii; i++) {
        file = files[i]
        ffile = nodePath.join(path, file)


        let fChar = file.charAt(0)

        if (!!~['_', '.'].indexOf(fChar)) {
          continue
        }

        let data = yield resolveFile(ffile)

        if (data == null) continue;

        if (typeof data === 'function') {
          self.tasks.push(data);
        } else if (Object == data.constructor) {
          for (let k in data) {
            if (typeof data[k] === 'function') {
              self.tasks.push(data[k]);
            }
          }
        }

      }

    });
  }

  destroy() {
    this.tasks = void 0;

  }


}


const cache = new Cache(nodePath.join(process.cwd(), '.tmp'));
const md5File = require('md5-file')

function md5Sum(path: string): Promise<string> {
  return new utils.Promise((resolve, reject) => {

    md5File(path, function(err, sum) {
      if (err) return reject(err);
      resolve(sum);
    })

  })
}

function *resolveFile(path: string): Iterator<any> {
  let ext = nodePath.extname(path)
  let basename = nodePath.basename(path, ext)
  let dirname = nodePath.dirname(path);

  let compileit = null

  if (!!~['.coffee', '.ts'].indexOf(ext)) {
    compileit = ext.substr(1) === 'ts' ? 'typescript' : 'coffeescript';
  } else if (ext == '.js' || ext == '.es6') {
    let firstline = yield readFirstLine(path)

    if (/^'use babel'/.test(firstline)) {
      compileit = 'babel';
    }
  }
  
  // Just regular javascript
  if (compileit === null) {
    return require(path);
  }

  // check if compiled file already exists and is update to date  
  let md5 = yield md5Sum(path);
  let tmpFile = nodePath.join(dirname, "." + basename + '.compiled.js')
  
  if (yield fs.exists(tmpFile)) {  
    if (md5 === cache.get(path)) {
      return require(tmpFile);
    }
  }
  

  let code: string = null;  
  
  switch (compileit) {
    case 'babel': 
      code = yield compileBabel(path);
      break;
    case 'typescript':
      code = compileTypescript(path);
      break;
    case 'coffeescript'
    
  }
  
  if (code == null) {
    throw new Error('could not compile file');
  } 

  yield fs.writeFile(tmpFile, code);
  cache.set(path, md5);
  yield cache.save()
  
  return require(tmpFile)

  /*if (/^'use babel'/.test(firstline)) {
    debug('use babel')

    var result = babel.transform(yield fs.readFile(path, 'utf8'), {
      optional: ['es7.decorators'],
      blacklist: ['regenerator']
    })

    yield fs.writeFile(tmpFile, result.code);

    cache.set(path, md5);
    yield cache.save()

    path = tmpFile

  }

  return require(path)*/

}

function * compileBabel (path: string): string {
  debug('use babel')

    var result = babel.transform(yield fs.readFile(path, 'utf8'), {
      optional: ['es7.decorators'],
      blacklist: ['regenerator']
    })
    
   return result.code
} 

function compileTypescript (path: string): string {
  
}

function readFirstLine(path: string): Promise<string> {

  return co(function *() {
    let fd = yield fs.open(path, 'r')

    let line = "", buffer = new Buffer(1), i = 0

    while (true) {

      let read = fs.readSync(fd, buffer, 0, 1)

      if (read <= 0) {
        break
      }

      if (buffer.toString() == '\n') break
      line += buffer.toString()

    }

    yield fs.close(fd)
    return line

  })


}
