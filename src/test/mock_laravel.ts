const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');


const channels = [
    "root",
    "presence",
    "private"
];

//{"user_id":2,"user_info":{"id":2,"name":"luser","roomId":"1"}}
const users = {
    1:{"user_id":1,"user_info":{"id":1,"name":"superman","roomId":"1"}},
    2:{"user_id":2,"user_info":{"id":2,"name":"luser","roomId":"1"}},
    3:{"user_id":3,"user_info":{"id":3,"name":"JohnDoe","roomId":"1"}},
};

/**
 * Mock Laravel Broadcasting Auth Api
 *
 * http POST  :7718/auth/broadcasting channel_name=root 'Authentication: Bearer 1'
 *
 * auth user_id will be 1
 */
export class MockLaravel {

    /** Express instance */
    private express: any;

    /** available Channels */
    private channels: any;

    /** available users*/
    private users: any;

    protected server: any;

    /**
     * Create new instance of http subscriber.
     *
     */
    constructor(private options: any) {
        this.channels = channels;
        this.users = users;

        this.express = express();
        this.express.use(bodyParser.urlencoded({extended: true}));
        this.express.use(bodyParser.json());

    }

    /**
     * Initialize Server.
     */
    run(): Promise<any> {
        return new Promise((resolve, reject) => {

            this.server = http.createServer(this.express);
            this.server.listen(this.options.dev.mock.laravel_port);
            this.init();

            return resolve();
        })
    }

    /**
     * Initialize the API.
     */
    init(): void {
        this.express.get(
            '/',
            (req, res) => this.getRoot(req, res),
        );
        this.express.post(
            '/broadcasting/auth',
            (req, res) => this.broadcasting(req, res),
        );
    }

    /**
     * Initialize the API.
     */
    stop(): void {
       this.server.close();
    }

    /**
     * Broadcasting Laravel mock
     *
     * @param req
     * @param res
     */
    broadcasting(req: any, res: any): any {
        const channel = req.body.channel_name;

        const bearer = req.headers.authorization;

        if(! bearer) return this.response401(req, res);

        const user_id = parseInt(bearer.split(' ')[1]);

        if(!user_id) return this.response401(req, res);

        switch (channel) {
            case 'root': {
                this.authorizeRoot(channel, user_id, auth => {
                    if(auth === false) return this.response401(req, res);
                    res.json(auth);
                });
                break;
            }

            case channel.match(/^presence-.*$/).input: {
                this.authorizePresence(channel, user_id, auth => {
                    if(auth === false) return this.response401(req, res);
                    res.json(auth);
                });
                break;
            }

            case channel.match(/^private-.*$/).input: {
                this.authorizePrivate(channel, user_id, auth => {
                    if(auth === false) return this.response401(req, res);
                    res.json(auth);
                });
                break;
            }

            default: {
                this.badResponse(req, res, `unknown channel ${channel}`)
            }
        }
    }

    /**
     * authorize Root Channel
     *
     * @param channel
     * @param user_id
     * @param cb
     */
    authorizeRoot(channel: string, user_id: number, cb: any): any {

        if(this.users[user_id])
            return cb({"channel_data":this.users[user_id]});

        return cb(false);
    }

    /**
     * authorize Presence
     *
     * @param channel
     * @param user_id
     * @param cb
     */
    authorizePresence(channel: string, user_id: number, cb: any): any {
        if(this.users[user_id])
            return cb({"channel_data":this.users[user_id]});

        return cb(false);
    }

    /**
     * authorize Private
     *
     * @param channel
     * @param user_id
     * @param cb
     */
    authorizePrivate(channel: string, user_id: number, cb: any): any {

        if(this.users[user_id]) return cb(true);

        return cb(false);
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

    /**
     * send 401 response
     *
     * @param req
     * @param res
     */
    response401(req: any, res: any): boolean {
        res.statusCode = 401;
        res.json({ message: 'Unauthorized' });

        return false;
    }
}
