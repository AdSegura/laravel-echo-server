const {EchoServer} = require("./echo-server");
//import {options} from "./default-options";

const options = require('../laravel-echo-server.json');

export class EchoServerFactory {

    /**
     * Create and start new Echo Server
     *
     * @param port
     * @param config
     */
    static start = (port: number, config: any = {}) => {

        const defaultOptions  = Object.assign({}, options);

        config = Object.assign({}, defaultOptions, config);

        config.devMode = true;
        config.testMode = true;
        config.port = port;

        const server = new EchoServer(config);

        return server.run();
    }
}
