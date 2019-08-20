import { DatabaseDriver } from './database-driver';
var Redis = require('ioredis');

export class RedisDatabase implements DatabaseDriver {
    /**
     * Redis client.
     */
    private _redis: any;

    /**
     * Create a new cache instance.
     */
    constructor(private options) {
        this._redis = new Redis(options.databaseConfig.redis);
    }

    /**
     * Retrieve data from redis.
     */
    get(key: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._redis.get(key).then(value => resolve(JSON.parse(value)));
        });
    }

    /**
     * Store data to cache.
     */
    set(key: string, value: any): void {
        this._redis.set(key, JSON.stringify(value));
        if (this.options.databaseConfig.publishPresence === true && /^presence-.*:members$/.test(key)) {
            this._redis.publish('PresenceChannelUpdated', JSON.stringify({
                "event": {
                    "channel": key,
                    "members": value
                }
            }));
        }
    }

    /**
     * Store data to cache.
     */
    setMember(key: string, value: any): void {
        this._redis.sadd(key, JSON.stringify(value));
    }

    /**
     * Store data to cache.
     */
    delMember(key: string, value: any): void {
        this._redis.srem(key, JSON.stringify(value));
    }

    /**
     * Retrieve data from redis.
     */
    isMember(key: string, channel: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._redis.sismember(channel, key).then(value => resolve(value));
        });
    }

    /**
     * Retrieve data from redis.
     */
    getMembers(channel: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._redis.smembers(channel).then(value => {
                resolve(value.map(user => {
                    return JSON.parse(user);
                }))
            });
        });
    }
}
