import {IoUtils} from "../utils/ioUtils";
import {Log} from "../log";
import {Logger} from "../log/logger";

export class CommandChannel {

    constructor(private options: any, protected io: any, protected log: Logger){

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

                Log.success('Close Socket ID: ' + command.data);

                IoUtils.close_all_user_sockets(command.data, this.io, this.log);

                break;
            }
            case 'exit_channel': {
                Log.success(`kick off user_id:${command.data.user_id} from Channel:${command.data.channel}`);
                this.log.info(`kick off user_id:${command.data.user_id} from Channel:${command.data.channel}`);

                let user = IoUtils.findUser(command.data.user_id, this.io);

                //TODO this.channel.leave(socket, room, 'Laravel Order');

                break;
            }
        }
    }
}
