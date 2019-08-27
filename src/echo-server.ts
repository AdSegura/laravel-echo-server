import {HttpSubscriber, RedisSubscriber, Subscriber} from './subscribers';
import {Channel} from './channels';
import {Server} from './server';
import {HttpApi} from './api';
import {IoUtils} from "./utils/ioUtils";
import {CommandChannel} from "./channels/commandChannel";
import {Database} from "./database";
import {Logger} from "./log/logger";


/**
 * Echo server class.
 */
export class EchoServer {

    /** Socket.io server instance. */
    private server: Server;

    /** Channel instance.*/
    private channel: Channel;

    /** command channel */
    private commandChannel: CommandChannel;

    /** Subscribers */
    private subscribers: Subscriber[];

    /** Http api instance. */
    private httpApi: HttpApi;

    /** Log to syslog */
    protected log: Logger;

    /** Database instance .*/
    protected db: Database;
    private debug: any;
    private ioUtils: IoUtils;

    /** Create a new instance. */
    constructor(private options: any) {

        this.debug = require('debug')(`server_${this.options.port}`);
        this.log = new Logger(this.options);

        this.db = new Database(this.options, this.log);


        this.server = new Server(this.options, this.log);
        this.log.setServerId(this.server.getServerId());

        this.ioUtils = new IoUtils(this.options);
    }

    /**
     * Start the Echo Server.
     *
     * @return promise
     */
    run = () => {
        return new Promise((resolve, reject) => {
            this.startup();
            this.server.init().then(io => {
                this.init(io).then(() => {
                    this.log.info(`Starting server ${this.server.getServerId()} in ${this.options.devMode ? 'DEV' : 'PROD'} mode`);
                    resolve(this);
                }).catch(e => reject(e));
            }).catch(e => reject(e));
        });
    }

    /**
     * Stop server when in test mode
     *
     * @return promise
     */
    stop(): Promise<any>{
        return this.server.stop()
    }

    /**
     * Initialize the class
     *
     * @return promise
     */
    init(io: any): Promise<any> {
        return new Promise((resolve, reject) => {

            this.channel = new Channel(io, this.options, this.log, this.db);
            this.commandChannel = new CommandChannel(this.options, io, this.log);

            this.subscribers = [];
            if (this.options.subscribers.http)
                this.subscribers.push(new HttpSubscriber(this.server.express, this.options, this.log));
            if (this.options.subscribers.redis)
                this.subscribers.push(new RedisSubscriber(this.options, this.log));

            this.httpApi = new HttpApi(io, this.channel, this.server.express, this.options.apiOriginAllow, this.log);
            this.httpApi.init();

            this.onConnect();

            this.listen().then(() => resolve(), err => this.debug(err));
        });
    }

    /**
     * Text shown at startup.
     */
    startup(): void {
        this.debug(`\nL A R A V E L  E C H O  S E R V E R  C L U S T E R ${this.server.getServerId()}\n`);
        this.debug(`Starting server in ${this.options.devMode ? 'DEV' : 'PROD'} mode`, true);
        this.debug(`Server: ${this.server.getServerId()} Log Mode is ${this.options.log} mode`, true);
    }

    /**
     * Listen for incoming event from subscibers.
     *
     * @return promise
     */
    listen(): Promise<any> {
        return new Promise((resolve, reject) => {
            let subscribePromises = this.subscribers.map(subscriber => {
                return subscriber.subscribe((channel, message) => {
                    return this.routeIncomingEvents(channel, message);
                });
            });

            Promise.all(subscribePromises).then(() => resolve());
        });
    }

    /**
     * Return a channel by its socket id.
     */
    find(socket_id: string): any {
        return this.server.io.sockets.connected[socket_id];
    }

    /**
     * routeIncomingEvents
     *
     * @param channel
     * @param message
     */
    routeIncomingEvents(channel: string, message: any): any {

        if(channel === this.options.command_channel){

            this.debug('ECHO SERVER GETS A COMMAND FROM LARAVEL');
            this.log.info('Comand to Execute: ' + JSON.stringify(message.data.command));

            this.commandChannel.execute(message.data.command)

        } else {

            return this.broadcast(channel, message);

        }
    }

    /**
     * Broadcast events to channels from subscribers.
     */
    broadcast(channel: string, message: any): boolean {
        if (message.socket && this.find(message.socket)) {
            return this.toOthers(this.find(message.socket), channel, message);
        } else {
            return this.toAll(channel, message);
        }
    }

    /**
     * Broadcast to others on channel.
     */
    toOthers(socket: any, channel: string, message: any): boolean {
        socket.broadcast.to(channel)
            .emit(message.event, channel, message.data);

        return true
    }

    /**
     * Broadcast to all members on channel.
     */
    toAll(channel: string, message: any): boolean {
        this.debug('Message To All ' + JSON.stringify(message) + ' On Channel ' + channel)
        this.server.io.to(channel)
            .emit(message.event, channel, message.data);

        return true
    }

    /**
     * On server connection.
     * { channel_data: { user_id: 1, user_info: 1 } }
     */
    onConnect(): void {
        this.server.io.on('connection', socket => {
            this.channel.joinRoot(socket) //Auth Root Channel '/'
                .then(auth => {
                    if(auth === false) {
                        const msg = `Auth: Failed for user:${auth.channel_data.user_id}, channel:root`;
                        return this.ioUtils.disconnect(socket, this.log, msg);
                    }

                    if(! auth.hasOwnProperty('channel_data') ){
                        let msg_err = 'Error: on Connect Echo-Server response';
                        msg_err += ' do not have channel_data property';
                        this.log.error(msg_err);
                        this.debug(msg_err);

                        return this.ioUtils.disconnect(socket, this.log, msg_err);
                    } else if(! auth.channel_data.hasOwnProperty('user_id') ){
                        let msg_err = 'Error: on Connect Echo-Server response';
                        msg_err += ' do not have channel_data.user_id property';
                        this.log.error(msg_err);
                        this.debug(msg_err);

                        return this.ioUtils.disconnect(socket, this.log, msg_err);
                    }

                    socket.user_id = auth.channel_data.user_id;
                    const ip = this.ioUtils.getIp(socket, this.options);

                    this.debug(`LOG Success on Server: ${this.server.getServerId()}`);

                    this.db.setUserInServer('echo_users', {
                        user_id: auth.channel_data.user_id,
                        socket_id: socket.id,
                        server_id: this.server.getServerId(),
                        ip: ip,
                        date: new Date()
                    });

                    if(this.options.multiple_sockets == false) {
                        this.debug(`close_all_user_sockets_except_this_socket ${socket.id}`);

                        this.ioUtils.close_all_user_sockets_except_this_socket(
                            auth.channel_data.user_id,
                            socket.id,
                            this.server.io,
                            this.log
                        );
                    }

                    this.db.removeInactiveSocketsInThisServer(
                        'echo_users',
                        this.ioUtils.getAllActiveSocketsInThisIoServer(this.server.io)
                    );

                    const msg_sucess = [
                        `Auth Success ON NSP /`,
                        `server_id:${this.server.getServerId()}`,
                        `user_id:${socket.user_id}`,
                        `with Socket:${socket.id} with IP:${ip}`
                    ].join(' ');

                    this.debug(msg_sucess);
                    this.log.info(msg_sucess);

                    return this.startSubscribers(socket);

                })
                .catch(e => {
                    const msg_error = `Auth: Socket:${socket.id} join Root Auth Error, reason:${e.reason}`
                    this.debug(msg_error);
                    this.log.error(msg_error);

                    this.ioUtils.disconnect(socket, this.log, msg_error)
                })
        });
    }

    /**
     * Start listening for Socket events
     *
     * @param socket
     */
    startSubscribers(socket: any): void {
        this.onSubscribe(socket);
        this.onUnsubscribe(socket);
        this.onDisconnecting(socket);
        this.onClientEvent(socket);
    }

    /**
     * On subscribe to a channel.
     */
    onSubscribe(socket: any): void {
        socket.on('subscribe', data => {
            this.channel.join(socket, data);
        });
    }

    /**
     * On unsubscribe from a channel.
     */
    onUnsubscribe(socket: any): void {
        socket.on('unsubscribe', data => {
            this.channel.leave(socket, data.channel, 'unsubscribed');
        });
    }

    /**
     * On socket disconnecting.
     */
    onDisconnecting(socket: any): void {
        socket.on('disconnecting', (reason) => {
            this.db.delUserInServerBySocketId('echo_users', socket.id);
            Object.keys(socket.rooms).forEach(room => {
                if (room !== socket.id) {
                    this.channel.leave(socket, room, reason);
                }
            });
        });
    }

    /**
     * On client events.
     */
    onClientEvent(socket: any): void {
        socket.on('client event', data => {
            this.channel.clientEvent(socket, data);
        });
    }
}
