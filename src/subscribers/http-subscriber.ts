import { Log } from './../log';
import { Subscriber } from './subscriber';
var url = require('url');

export class HttpSubscriber implements Subscriber {
    /**
     * Create new instance of http subscriber.
     *
     * @param  {any} express
     * @param options
     * @param log
     */
    constructor(private express, private options, protected log: any) { }

    /**
     * Subscribe to events to broadcast.
     *
     * @return {void}
     */
    subscribe(callback): Promise<any> {
        return new Promise((resolve, reject) => {
            // Broadcast a message to a channel
            this.express.post('/apps/:appId/events', (req, res) => {
                let body: any = [];
                res.on('error', (error) => {
                    Log.error(error);
                    this.log.error('Http Subscriber events ' + error);
                });

                req.on('data', (chunk) => body.push(chunk))
                    .on('end', () => this.handleData(req, res, body, callback));
            });

            Log.success('Listening for http events...');

            resolve();
        });
    }

    /**
     * Handle incoming event data.
     *
     * @param  {any} req
     * @param  {any} res
     * @param  {any} body
     * @param  {Function} broadcast
     * @return {boolean}
     */
    handleData(req, res, body, broadcast): boolean {
        body = JSON.parse(Buffer.concat(body).toString());

        if ((body.channels || body.channel) && body.name && body.data) {

            var data = body.data;
            try {
                data = JSON.parse(data);
            } catch (e) { }

            var message = {
                event: body.name,
                data: data,
                socket: body.socket_id
            };

            var channels = body.channels || [body.channel];

            Log.info("Channel: " + channels.join(', '));
            Log.info("Event: " + message.event);

            channels.forEach(channel => broadcast(channel, message));

        } else {
            return this.badResponse(
                req,
                res,
                'Event must include channel, event name and data'
            );
        }

        res.json({ message: 'ok' })
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
        this.log.error('http bad response:' + message)
        res.json({ error: message });

        return false;
    }
}
