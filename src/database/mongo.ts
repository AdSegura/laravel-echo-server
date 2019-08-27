import { DatabaseDriver } from './database-driver';
import {Logger} from "../log/logger";
const MongoClient = require('mongodb').MongoClient;

export class MongoDatabase implements DatabaseDriver {

    /** mongo instance.*/
    private _mongo: any;

    /** mongo client */
    private db: any;
    private debug: any;
    private mongoOpt: { password: null; port: string; dbName: string; host: string; user: null };


    /**
     * Create a new cache instance.
     */
    constructor(private options: any, protected log: Logger) {

        this.debug = require('debug')(`server_${this.options.port}:mongo`);

        if(this.options.testMode == true){

            this.mongoOpt = this.options.dev.databaseConfig.mongo

        } else {

            this.mongoOpt = this.options.databaseConfig.mongo
        }


        this._mongo = new MongoClient(this.url(), {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                connectTimeoutMS: 3000
            });

        this.connect();
    }

    /**
     * Connect top Mongo set up this.db
     */
    connect (): any{
        this._mongo.connect((err) => {

            if(err) {
                const msg = `Mongo: Connection to Mongo Server:${this.url()} Database:${this.mongoOpt.dbName} has Failed`;
                this.debug(msg);
                this.log.error(msg);
            }

            this.debug("Connected successfully to Mongo server");

            this.db = this._mongo.db(this.mongoOpt.dbName);
        });
    }

    /**
     * Set up Mongo URL
     *
     * @return string 'mongodb://user:pass@host:port'
     */
    private url(): string{

        let url = 'mongodb://';

        const user = this.mongoOpt.user;
        const password = this.mongoOpt.password;

        if(user){
            url += user;
            if(password)
                url += `:${password}@`;

            url += ":''@";
        }

        url += this.mongoOpt.host;
        url += `:${this.mongoOpt.port}`;

        return url;
    }


    /**
     * Set new Member on presence channel
     *
     * @param channel
     * @param member
     */
    setMember(channel: string, member: any): void {
        this.debug(`MONGO SetMember on Channel: ${channel}, Member: ${JSON.stringify(member)}`);
        this.insertOne(channel, member);
    }

    /**
     * Delete Member from presence channel
     *
     * @param channel
     * @param member
     */
    delMember(channel: string, member: any): void {

        this.debug(`MONGO Delete Member  MemberID: ${member[0].user_id} , SocketId: ${member[0].socketId}`);

        this.deleteOne(channel, {user_id: member[0].user_id});
    }

    /**
     * Is Member on Channel
     *
     * @param channel
     * @param member
     */
    isMember(channel: string, member: any): Promise<any> {
        this.debug(`MONGO IS_Member on Channel: ${channel}, Member: ${JSON.stringify(member)}`);
        return new Promise<any>((resolve, reject) => {
            this.db.collection(channel).find({user_id: member.user_id}).toArray((err, res) =>{
                if(err) {
                    const msg = `Mongo: isMember Error:${err.message}`;
                    this.log.error(msg);
                    this.debug(msg);
                    return reject(err)
                }
                return resolve(res[0])
            });
        });
    }

    /**
     * Retrieve data from redis.
     */
    getMember(channel: string, member: any): Promise<any> {
        this.debug(`MONGO GETMember on Channel: ${channel}, Member: ${JSON.stringify(member)}`);
        return new Promise<any>((resolve, reject) => {
            this.db.collection(channel).find({user_id: member.user_id}).toArray((err, res) =>{
                if(err) {
                    const msg = `Mongo: getMember Error:${err.message}`;
                    this.debug(msg);
                    this.log.error(msg);
                    return reject(err)
                }
                return resolve(res)
            });
        });
    }

    /**
     * Retrieve data from redis.
     */
    getMemberBySocketId(channel: string, socketId: string): Promise<any> {
        this.debug(`MONGO GETMember By Socket ID on Channel: ${channel}, soketId: ${JSON.stringify(socketId)}`)
        return new Promise<any>((resolve, reject) => {
            this.db.collection(channel).find({socketId: socketId}).toArray((err, res) =>{
                if(err) {
                    const msg = `Mongo: getMemberBySocketId Error:${err.message}`;
                    this.debug(msg);
                    this.log.error(msg);
                    return reject(err)
                }
                return resolve(res)
            });
        });
    }

    /**
     * Retrieve data from redis.
     */
    getMembers(channel: string): Promise<any> {
        this.debug(`MONGO GETMemberS on Channel: ${channel}`);
        return new Promise<any>((resolve, reject) => {
            this.db.collection(channel).find({}).toArray((err, res) =>{
                if(err) {
                    const msg = `Mongo: getMembers Error:${err.message}`;
                    this.debug(msg);
                    this.log.error(msg);
                    return reject(err)
                }
                this.debug(`MONGO GET MEMBERS on Channel: ${channel}, Members: ${JSON.stringify(res)}`);
                return resolve(res)
            });
        });
    }

    /**
     * remove Inactive sockets from presence channel
     *
     * @param channel
     * @param sockets array active io sockets on this channel
     */
    removeInactive(channel: string, sockets: any): Promise<any>{
        return new Promise((resolve, reject) => {
            this.db.collection(channel).deleteMany({socketId: { $nin: sockets }}, (err, res) => {
                if(err) {
                    const msg = `Mongo: removeInactive Error:${err.message}`;
                    this.debug(msg);
                    this.log.error(msg);
                    return reject(err);
                }
                return resolve();
            })
        });
    }

    /**
     * remove Inactive sockets from presence channel
     *
     * @param collection
     * @param sockets array active io sockets on this channel
     */
    removeInactiveSocketsInThisServer(collection: string, sockets: any): Promise<any>{
        return new Promise((resolve, reject) => {
            this.db.collection(collection).deleteMany({socket_id: { $nin: sockets }}, (err, res) => {
                if(err) {
                    const msg = `Mongo: removeInactiveSocketsInThisServer Error:${err.message}`;
                    this.debug(msg);
                    this.log.error(msg);
                    return reject(err);
                }
                return resolve();
            })
        });
    }

    /**
     * set user in server
     *
     * @param collection
     * @param user
     */
    setUserInServer(collection: string, user: any): void{
        this.insertOne(collection, user);
    };

    /**
     * Delete user in server by SocketId
     *
     * @param collection
     * @param socket_id
     */
    delUserInServerBySocketId(collection: string, socket_id: any): void {
        this.deleteOne(collection, {socket_id: socket_id})
    }

    /**
     * Insert One
     *
     * @param collection
     * @param data
     */
    private insertOne(collection: string, data: any): void{
        this.db.collection(collection).insertOne(data, (err, res) =>{
            if(err) {
                const msg = `Mongo: insertOne Error:${err.message}`;
                this.debug(msg);
                this.log.error(msg);
                throw new Error(msg);
            }
        });
    }

    /**
     * Delete One
     *
     * @param collection
     * @param data {foo: bar}
     */
    private deleteOne(collection: string, data: any): void{
        this.db.collection(collection).deleteOne(data, (err, res) =>{
            if(err) {
                const msg = `Mongo: deleteOne Error:${err.message}`;
                this.debug(msg);
                this.log.error(msg);
                throw new Error(msg);
            }
        });
    }
}
