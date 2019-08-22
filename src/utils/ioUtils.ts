import {Log} from "../log";
import {Logger} from "../log/logger";

export class IoUtils {

    /**
     * Find User
     *
     * @param id
     * @param io
     */
    static findUser(id: number, io: any): any {

        let ids = Object.keys(io.sockets.sockets);

        let user_data = {
            id,
            sockets: [],
            rooms: []
        };

        ids.forEach(i => {
            if (io.sockets.sockets[i].user_id == id) {
                user_data.sockets.push(i);
                user_data.rooms.push(io.sockets.sockets[i].rooms);
            }
        });

        return user_data;
    }

    /**
     * Return a channel by its socket id.
     */
    static findSocketById(socket_id: string, io: any): any {
        return io.sockets.connected[socket_id];
    }

    /**
     * get Users In Channel
     *
     * @param channel
     * @param io
     */
    static getUsersInChannel(channel: string, io: any){
        let room = io.sockets.adapter.rooms[channel];
        let sockets = [];

        if(room && room.sockets) {
            Object.keys(room.sockets).forEach(socketId => {
                let socket = this.findSocketById(socketId, io);
                sockets.push({socket_id: socket.id, user_id: socket.user_id});
            });
        }

        return sockets;
    }

    /**
     * get User's Sockets In Channel
     *
     * @param user_id
     * @param channel
     * @param io
     *
     * @returns array [{socketId, user_id}]
     */
    static getUserSocketsInChannel(user_id: number, channel: string, io: any){

        let sockets = this.getUsersInChannel(channel, io);

        let user_sockets = [];

        sockets.forEach(socketInfo => {
            if(socketInfo.user_id == user_id)
                user_sockets.push(socketInfo)
        });

        return user_sockets;
    }

    /**
     * Disconnect a Socket
     *
     * @param socket
     * @param reason
     * @param logger
     */
    static disconnect(socket: any, logger: Logger, reason: string){
        Log.error(`Disconnect socket:${socket.id}, reason:${reason}`);
        logger.info(`Disconnect socket:${socket.id}, reason:${reason}`);
        socket.disconnect(true)
    }

    /**
     * Get Socket's client Ip
     *
     * @param socket
     * @param options
     */
    static getIp(socket: any, options: any){

        if(options.behind_proxy)
            return socket.handshake.headers['x-forwarded-for'];

        return socket.handshake.address;
    }

    /**
     * close_all_user_sockets
     *
     * @param user_id
     * @param io
     * @param log
     */
    static close_all_user_sockets(user_id: number, io: any, log: Logger): void{

        let user = this.findUser(user_id, io);

        if (user.sockets.length === 0) return;

        Log.success('close_all_user_sockets: We have Rogue Sockets to Kill');

        user.sockets.forEach(socketId => {
            this.disconnect(
                io.sockets.sockets[socketId],
                log,
                'close_all_user_sockets Laravel Close Socket Command'
            );
        });
    }

    /**
     * close_all_user_sockets_except_this_socket
     *
     * @param user_id
     * @param socket_id
     * @param io
     * @param log
     */
    static close_all_user_sockets_except_this_socket(user_id: number, socket_id: string, io: any, log: Logger): void{

        let user = this.findUser(user_id, io);

        if (user.sockets.length === 0) return;

        Log.success('close_all_user_sockets: We have Rogue Sockets to Kill');

        user.sockets.forEach(socketId => {
            if(socketId !== socket_id)
                this.disconnect(
                    io.sockets.sockets[socketId],
                    log,
                    `close_all_user_sockets_except_this_socket ${socket_id} Laravel Close Socket Command`
                );
        });
    }

    /**
     * get All Active Sockets in This IoServer
     *
     * @param io
     * @return array sockets_id
     */
    static getAllActiveSocketsInThisIoServer(io: any): any{
        const sockets = io.sockets.clients();
        return Object.keys(sockets.connected);
    }
}
