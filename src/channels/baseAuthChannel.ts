import {Log} from "../log";
import {Logger} from "../log/logger";

let url = require('url');
const request = require('request');
const cookie = require('cookie');

export class BaseAuthChannel {

    /**
     * Request client.
     */
    protected request: any;

    /**
     * Master NSP /
     */
    protected rootChannel = 'root';

    /**
     * instance base auth
     *
     * @param options
     * @param log
     */
    constructor(protected options: any, protected log: Logger) {

        this.request = request;
    }

    /**
     * Send authentication request to application server.
     */
    authenticate(socket: any, data: any = null): Promise<any> {

        const options = this.prepareRequestOptions(socket, data);

        Log.info(`[${new Date().toLocaleTimeString()}] - Sending auth request to: ${options.url} channel:${options.form.channel_name}\n`);

        //this.log.info(`Sending auth request to: ${options.url} channel_request:${options.form.channel_name}`);

        return this.serverRequest(socket, options);
    }

    /**
     * SetUp Request options
     *
     * @param socket
     * @param data
     */
    prepareRequestOptions(socket: any, data: any = null) {

        let options = {
            url: this.authHost(socket) + this.options.authEndpoint,
            form: {channel_name: this.rootChannel, multiple_sockets: this.options.multiple_sockets},
            headers: {},
            rejectUnauthorized: false
        };

        if (data && data.channel)
            options.form.channel_name = data.channel;

        return options;
    }

    /**
     * Send a request to the server.
     *
     * { channel_data: { user_id: 2, user_info: 2 } }
     */
    protected serverRequest(socket: any, options: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {

            options.headers = this.prepareHeaders(socket);

            let body;

            this.request.post(options, (error, response, body, next) => {

                if (error) {

                    Log.error(`[${new Date().toLocaleTimeString()}] - Error authenticating ${socket.id} for ${options.form.channel_name}`);
                    this.log.error(`Error authenticating ${socket.id} for ${options.form.channel_name}`);

                    reject({reason: 'Error sending authentication request.', status: 0});

                } else if (response.statusCode !== 200) {

                    Log.warning(`[${new Date().toLocaleTimeString()}] - ${socket.id} could not be authenticated to ${options.form.channel_name}`);
                    this.log.error(`${socket.id} could not be authenticated to ${options.form.channel_name}`);
                    Log.error(response.body);

                    reject({
                        reason: 'Client can not be authenticated, got HTTP status ' + response.statusCode,
                        status: response.statusCode
                    });

                } else {
                    try {
                        body = JSON.parse(response.body);
                    } catch (e) {
                        body = response.body
                    }

                    const msg = [
                        `Auth: user_id:${body.channel_data.user_id},`,
                        `socket_id:${socket.id},`,
                        `channel:${options.form.channel_name}`
                       ].join(' ');

                    Log.info(`[${new Date().toLocaleTimeString()}] - ` + msg);
                    this.log.info(msg);

                    resolve(body);
                }
            });
        });
    }

    /**
     * Get the auth host based on the Socket.
     */
    protected authHost(socket: any): string {
        let authHosts = (this.options.authHost) ?
            this.options.authHost : this.options.host;

        if (typeof authHosts === "string") {
            authHosts = [authHosts];
        }

        let authHostSelected = authHosts[0] || 'http://localhost';

        if (socket.request.headers.referer) {
            let referer = url.parse(socket.request.headers.referer);

            for (let authHost of authHosts) {
                authHostSelected = authHost;

                if (this.hasMatchingHost(referer, authHost)) {
                    authHostSelected = `${referer.protocol}//${referer.host}`;
                    break;
                }
            }
        }

        Log.success(`[${new Date().toLocaleTimeString()}] - Preparing authentication request to: ${authHostSelected}`);

        return authHostSelected;
    }

    /**
     * Check if there is a matching auth host.
     */
    protected hasMatchingHost(referer: any, host: any): boolean {
        return referer.hostname.substr(referer.hostname.indexOf('.')) === host ||
            `${referer.protocol}//${referer.host}` === host ||
            referer.host === host;
    }

    /**
     * Prepare headers for request to app server.
     */
    protected prepareHeaders(socket: any): any {

        let headers = {};

        headers['Cookie'] = socket.request.headers.cookie;
        headers['X-Requested-With'] = 'XMLHttpRequest';
        headers['X-Socket-Id'] = socket.id;


        if (socket.request.headers['Authorization']) {
            headers['Authorization'] = socket.request.headers['Authorization']
            Log.success("Bearer Authorization");
        } else if (socket.request.headers['authorization']) {
            headers['Authorization'] = socket.request.headers['authorization']
            Log.success("Bearer Authorization");
        } else if (socket.request._query.token) {
            headers['Authorization'] = ' Bearer ' + socket.request._query.token;
            Log.success("Query Token Authorization");
        } else {
            Log.success("JWT_TOKEN Cookie Authorization");
            const cookies = cookie.parse(socket.request.headers.cookie);
            headers['Authorization'] = ' Bearer ' + cookies['jwt_token'];
        }

        return headers;
    }
}
