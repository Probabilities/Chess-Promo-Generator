class InputManager {
    constructor(contents, opts = {}) {
        this.contents = contents
        this.opts = opts
        this.counter = 0
    }

    getNextLine = () => new Promise(async(resolve) => {
        let line = this.contents?.[this.counter]
        if(!line && this.opts.loop) {
            this.counter = 0
            line = this.contents?.[this.counter]
        }

        this.counter += 1

        resolve(line)
    })
}

export default InputManager