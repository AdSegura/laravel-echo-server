import { Log } from './../log';
let url = require('url');
import * as _ from 'lodash';
import {IoUtils} from "../utils/ioUtils";

export class HttpApi {
    /**
     * Create new instance of http subscriber.
     *
     * @param  {any} io
     * @param  {any} channel
     * @param  {any} express
     * @param  {object} options object
     * @param  {any} log
     */
    constructor(private io, private channel, private express, private options, protected log: any) { }

    /**
     * Initialize the API.
     */
    init(): void {
        this.corsMiddleware();
        this.corsMiddleware();

        this.express.get(
            '/',
            (req, res) => this.getRoot(req, res),
        );

        this.express.get(
            '/apps/:appId/status',
            (req, res) => this.getStatus(req, res)
        );

        this.express.get(
            '/apps/:appId/channels',
            (req, res) => this.getChannels(req, res)
        );

        this.express.get(
            '/apps/:appId/channels/:channelName',
            (req, res) => this.getChannel(req, res)
        );

        this.express.get(
            '/apps/:appId/channels/:channelName/users',
            (req, res) => this.getChannelUsers(req, res)
        );

        this.express.get(
            '/apps/:appId/channels/:channel_name/user/:user_id',
            (req, res) => this.getUserSocketsInChannel(req, res)
        );

        this.express.post(
            '/apps/:appId/channels/leave/:channel_name/user/:user_id',
            (req, res) => this.kickOffUserFromChannel(req, res)
        );

        this.express.get(
            '/apps/:appId/user/:user_id',
            (req, res) => this.findUser(req, res)
        );


    }

    /**
     * Add CORS middleware if applicable.
     */
    corsMiddleware(): void {
        if (this.options.allowCors) {
            this.express.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', this.options.allowOrigin);
                res.header('Access-Control-Allow-Methods', this.options.allowMethods);
                res.header('Access-Control-Allow-Headers', this.options.allowHeaders);
                next();
            });
        }
    }

    /**
     * Find user by id
     *
     * @param req
     * @param res
     */
    findUser(req: any, res: any): void {
        const user_id = req.params.user_id;

        const user_data = IoUtils.findUser(user_id, this.io);

        res.json({ user: user_data });
    }

    /**
     * Outputs a simple message to show that the server is running.
     *
     * @param {any} req
     * @param {any} res
     */
    getRoot(req: any, res: any): void {
        res.send('OK');
    }

    /**
     * Get the status of the server.
     *
     * @param {any} req
     * @param {any} res
     */
    getStatus(req: any, res: any): void {
        res.json({
            subscription_count: this.io.engine.clientsCount,
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
        });
    }

    /**
     * Get a list of the open channels on the server.
     *
     * @param {any} req
     * @param {any} res
     */
    getChannels(req: any, res: any): void {
        let prefix = url.parse(req.url, true).query.filter_by_prefix;
        let rooms = this.io.sockets.adapter.rooms;
        let channels = {};

        Object.keys(rooms).forEach(function(channelName) {
            if (rooms[channelName].sockets[channelName]) {
                return;
            }

            if (prefix && !channelName.startsWith(prefix)) {
                return;
            }

            channels[channelName] = {
                subscription_count: rooms[channelName].length,
                occupied: true
            };
        });

        res.json({ channels: channels });
    }

    /**
     * Get a information about a channel.
     *
     * @param  {any} req
     * @param  {any} res
     */
    getChannel(req: any, res: any): void {
        let channelName = req.params.channelName;
        let room = this.io.sockets.adapter.rooms[channelName];
        let subscriptionCount = room ? room.length : 0;


        let sockets = IoUtils.getUsersInChannel(channelName, this.io);

        let result = {
            subscription_count: subscriptionCount,
            occupied: !!subscriptionCount,
            sockets
        };

        if (this.channel.isPresence(channelName)) {
            this.channel.presence.getMembers(channelName).then(members => {
                result['user_count'] = _.uniqBy(members, 'user_id').length;

                res.json(result);
            });
        } else {
            res.json(result);
        }
    }

    /**
     * Get the users of a channel.
     *
     * @param  {any} req
     * @param  {any} res
     * @return {boolean}
     */
    getChannelUsers(req: any, res: any): boolean {
        let channelName = req.params.channelName;

        if (!this.channel.isPresence(channelName)) {
            return this.badResponse(
                req,
                res,
                'User list is only possible for Presence Channels'
            );
        }

        this.channel.presence.getMembers(channelName).then(members => {
            let users = [];

            _.uniqBy(members, 'user_id').forEach((member: any) => {
                users.push({ id: member.user_id });
            });

            res.json({ users: users });
        }, error => Log.error(error));
    }

    /**
     * Get Sockets in channel based on user_id
     *
     * @param req
     * @param res
     */
    getUserSocketsInChannel(req: any, res: any): void {
        const {user_id, channel_name} = req.params;

        const sockets = IoUtils.getUserSocketsInChannel(user_id, channel_name, this.io);

        return res.json(sockets);
    }

    /**
     * kickOff User From Channel
     *
     * @param req
     * @param res
     */
    kickOffUserFromChannel(req: any, res: any): void {
        const {user_id, channel_name} = req.params;

        const sockets = IoUtils.getUserSocketsInChannel(user_id, channel_name, this.io);

        sockets.forEach(socketInfo => {
            let socket = IoUtils.findSocketById(socketInfo.socket_id, this.io);
            if(socket)
                this.channel.leave(socket, channel_name, 'kickOff Channel')
        });

        this.log.info(`kickOff User ${user_id} From Channel ${channel_name}`);

        return res.json({sockets_killed: sockets});
    }

    /**
     * Handle bad requests.
     *
     * @param  {any} req
     * @param  {any} res
     * @param  {string} message
     * @return {boolean}
     */
    badResponse(req: any, res: any, message: string): boolean {
        res.statusCode = 400;
        res.json({ error: message });

        return false;
    }
}
