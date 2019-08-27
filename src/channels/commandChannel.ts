import {IoUtils} from "../utils/ioUtils";
import {Logger} from "../log/logger";

export class CommandChannel {
    private debug: any;
    private ioUtils: IoUtils;

    constructor(private options: any, protected io: any, protected log: Logger){
        this.debug = require('debug')(`server_${this.options.port}:command-channel`);
        this.ioUtils = new IoUtils(this.options)
    }

    /**
     * Execute Laravel commands
     *
     * @param command
     */
    execute(command: any): any {
        let comando = command.execute;

        switch (comando) {
            case 'close_socket': {

                this.debug('Close Socket ID: ' + command.data);

                this.ioUtils.close_all_user_sockets(command.data, this.io, this.log);

                break;
            }
            case 'exit_channel': {
                this.debug(`kick off user_id:${command.data.user_id} from Channel:${command.data.channel}`);
                this.log.info(`kick off user_id:${command.data.user_id} from Channel:${command.data.channel}`);

                let user = this.ioUtils.findUser(command.data.user_id, this.io);

                //TODO this.channel.leave(socket, room, 'Laravel Order');

                break;
            }
        }
    }
}
