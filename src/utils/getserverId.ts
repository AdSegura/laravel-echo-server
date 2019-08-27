const os = require('os');

export class ServerId {
    static get(options: any){
        return `${os.hostname()}_${options.port}`
    }
}
