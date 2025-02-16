var Redis = require('ioredis');
import { Log } from './../log';
import { Subscriber } from './subscriber';

export class RedisSubscriber implements Subscriber {
    /**
     * Redis pub/sub client.
     *
     * @type {object}
     */
    private _redis: any;

    /**
     * Create a new instance of subscriber.
     *
     * @param {any} options
     * @param log
     */
    constructor(private options, protected log: any) {
        this._redis = new Redis(options.databaseConfig.redis);
    }

    /**
     * Subscribe to events to broadcast.
     *
     * @return {Promise<any>}
     */
    subscribe(callback): Promise<any> {

        return new Promise((resolve, reject) => {
            this._redis.on('pmessage', (subscribed, channel, message) => {
                try {
                    message = JSON.parse(message);

                    Log.info("Channel: " + channel);
                    Log.info("Event: " + message.event);

                    callback(channel, message);

                } catch (e) {
                    this.log.error("Redis Subscriber on pmessage No JSON message " + JSON.stringify(message));

                    Log.warning(e);
                    Log.warning("No JSON message " + JSON.stringify(message));

                }
            });

            this._redis.psubscribe('*', (err, count) => {
                if (err) {
                    reject('Redis could not subscribe.')
                }
                Log.success('Listening for redis events...');
                resolve();
            });
        });
    }
}
