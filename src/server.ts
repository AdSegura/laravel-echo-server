import {Logger} from "./log/logger";
const http = require('http');
const express = require('express');
const url = require('url');
const io = require('socket.io');
const redisAdapter = require('socket.io-redis');
import {ServerId} from "./utils/getserverId";
const os = require("os");

export class Server {
    /**
     * The http server.
     *
     * @type {any}
     */
    public express: any;

    /**
     * Socket.io client.
     *
     * @type {object}
     */
    public io: any;

    /** express httpServer */
    protected server: any;

    /** id representing server instance */
    protected server_id: any;

    /** debug */
    private debug: any;

    /**
     * Create a new server instance.
     */
    constructor(private options: any, protected log: Logger) {
        this.server_id = ServerId.get(this.options);
        this.debug = require('debug')(`server_${this.options.port}:server`);
    }

    /**
     * Start the Socket.io server.
     *
     * @return {void}
     */
    init(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.httpServer().then(instance => {

                this.debug(`Server: ${this.server_id} Running at ${this.options.host} on port ${this.options.port}`);
                this.log.info(`Server: ${this.server_id} Running at ${this.options.host} on port ${this.options.port}`);

                resolve(this.io);
            }, error => reject(error));
        });
    }

    /**
     * Select the http protocol to run on.
     *
     * @return {Promise<any>}
     */
    serverProtocol(): Promise<any> {
        return this.httpServer()
    }


    /**
     * Create a socket.io server.
     *
     *
     */
    httpServer(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.express = express();
            this.express.use((req, res, next) => {
                for (var header in this.options.headers) {
                    res.setHeader(header, this.options.headers[header]);
                }
                next();
            });

            const httpServer = http.createServer(this.express);

            this.authorizeRequests();

            this.io = io(httpServer, this.options.socketio);
            this.io.adapter(redisAdapter(this.options.cluster.adapter.redis));

            function cb() {
                return resolve.call(this, this)
            }

            this.server = httpServer.listen(this.getPort(), this.options.host, () =>  cb.call(this));
        })

    }

    /**
     * Attach global protection to HTTP routes, to verify the API key.
     */
    authorizeRequests(): void {
        this.express.param('appId', (req, res, next) => {
            if (!this.canAccess(req)) {
                return this.unauthorizedResponse(req, res);
            }
            next();
        });
    }

    /**
     * Check is an incoming request can access the api.
     *
     * @param  {any} req
     * @return {boolean}
     */
    canAccess(req: any): boolean {
        let appId = this.getAppId(req);
        let key = this.getAuthKey(req);

        if (key && appId) {
            let client = this.options.clients.find((client) => {
                return client.appId === appId;
            });

            if (client) {
                return client.key === key;
            }
        }

        return false;
    }

    /**
     * Get the appId from the URL
     *
     * @param  {any} req
     * @return {string|boolean}
     */
    getAppId(req: any): (string | boolean) {
        if (req.params.appId) {
            return req.params.appId;
        }

        return false;
    }

    /**
     * Get the api token from the request.
     *
     * @param  {any} req
     * @return {string|boolean}
     */
    getAuthKey(req: any): (string | boolean) {
        if (req.headers.authorization) {
            return req.headers.authorization.replace('Bearer ', '');
        }

        if (url.parse(req.url, true).query.auth_key) {
            return url.parse(req.url, true).query.auth_key
        }

        return false;

    }

    /**
     * Handle unauthorized requests.
     *
     * @param  {any} req
     * @param  {any} res
     * @return {boolean}
     */
    unauthorizedResponse(req: any, res: any): boolean {
        res.statusCode = 403;
        res.json({error: 'Unauthorized'});

        return false;
    }

    /**
     * Stop server when in test mode
     */
    stop(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.server.close();
            resolve();
        })
    }

    /**
     * Generate Server Id
     *
     * @return string hostname_port
     */
    generateServerId(): string {
        const hostname = os.hostname();
        const port = this.getPort();

        return `${hostname}_${port}`
    }

    /**
     * get Server Id
     *
     * @return string hostname_port
     */
    getServerId(): string {
        return this.server_id;
    }


    /**
     * Sanitize the port number from any extra characters
     *
     * @return {number}
     */
    getPort() {
        let portRegex = /([0-9]{2,5})[\/]?$/;
        let portToUse = String(this.options.port).match(portRegex); // index 1 contains the cleaned port number only
        return Number(portToUse[1]);
    }

}
