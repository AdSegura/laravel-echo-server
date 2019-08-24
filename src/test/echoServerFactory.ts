//var Cli = require('../../dist/cli');
import {Cli} from "../cli/cli";

export class EchoServerFactory {

    constructor(protected port: number, protected config?: any){

    }

    start(): Promise<any>{
        let options = {
            devMode: true,
            testMode: true,
            log: "syslog",
            console_log: false,
            port:this.port
        };

        if(this.config) options = Object.assign(options, this.config);

        let cli = new Cli();

        return cli.startServer(options)
    }
}
