/// <reference path="interfaces" />

const fs = require('mz/fs')
import co from './co'
import * as nodePath from 'path'
import * as utils from './utils'
//import * as babel from 'babel-core'
import dbg from 'debug'

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
    constructor(options: TasksOptions={}) {
        this.config = options
        this.config.serial = options.serial||false
    }

    run(iterator?: (tasks: ITask) => Promise<any>|void): Promise<any> {

        var self = this, i, ii, tasks = this.tasks, task, ret, serial = this.config.serial

        return co(function *() {

        		let queue = [], ret
            
            for (i = 0, ii = tasks.length; i < ii; i++) {
                task = tasks[i];
               
                if (iterator) {
                    ret = utils.callFunc(iterator,undefined,[task])
                   
                } else {
                    ret = utils.callFunc(task,undefined);
                }
                
                serial ? (yield ret) : queue.push(ret);

            }

            if (serial) yield queue


        });




    }

    add(tasks: ITask[]|ITask): Tasks {

        if (!Array.isArray(tasks)) {
            tasks = [tasks]
        }
        this.tasks = this.tasks.concat(tasks)
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
                            this.tasks.push(data[k]);
                        }
                    }
                }

            }

        });
    }


}

function *resolveFile(path:string): Promise<any> {
	let ext = nodePath.extname(path)
	let basename = nodePath.basename(path, ext)
	let dirname = nodePath.dirname(path);
	let tmpFile = nodePath.join(dirname, basename + '.compiled' + ext)


	if (yield fs.exists(tmpFile)) {
		return require(tmpFile);
	}

  if (ext !== '.js') return null

  let firstline = yield readFirstLine(path)



  if (/^'use babel'/.test(firstline)) {
  	debug('use babel')

  	var result = babel.transform(yield fs.readFile(path,'utf8'),{
  		optional: ['es7.decorators'],
  		blacklist: ['regenerator']
  	})

  	yield fs.writeFile(tmpFile, result.code);

  	path = tmpFile

  }

  return require(path)

}

function readFirstLine (path:string): Promise<string> {

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
