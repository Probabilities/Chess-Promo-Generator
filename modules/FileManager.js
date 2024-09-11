import { Mutex } from 'async-mutex';
import fsp from 'fs/promises';

class FileManager {
    constructor(dir) {
        this.dir = dir
        this.mutex = new Mutex()
    }


    writeLine = (line) => new Promise(async(resolve) => {
        const release = await this.mutex.acquire()

        try{
            await fsp.appendFile(this.dir, line + '\n')
        }finally{
            release()
        }

        resolve()
    })
}

export default FileManager;