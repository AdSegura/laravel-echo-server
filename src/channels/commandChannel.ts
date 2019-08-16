import {IoUtils} from "../utils/ioUtils";
import {Log} from "../log";

export class CommandChannel {

    constructor(private options: any, protected io: any, protected log: any){

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

                let user = IoUtils.findUser(command.data, this.io);

                if (user.sockets.length === 0) return;

                Log.success('We have a Rogue Sockets to Kill');

                user.sockets.forEach(socketId => {
                    IoUtils.disconnect(
                        this.io.sockets.sockets[socketId],
                        this.log,
                        'Laravel Close Socket Command'
                        );
                });

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
