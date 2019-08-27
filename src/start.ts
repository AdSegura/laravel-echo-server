const {EchoServer} = require("./echo-server");

export class Starter {

    /**
     * create and return new Echo Server
     *
     * @param options
     */
   static run = (options: any) => {
        const server = new EchoServer(options);
        return server.run();
    }
}



