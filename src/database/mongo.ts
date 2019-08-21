import { DatabaseDriver } from './database-driver';
import {Log} from "../log";
const MongoClient = require('mongodb').MongoClient;

export class MongoDatabase implements DatabaseDriver {

    /** mongo instance.*/
    private _mongo: any;

    /** mongo client */
    private db: any;

    /**
     * Create a new cache instance.
     */
    constructor(private options) {

        this._mongo = new MongoClient(
            this.url(),
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });


        this.connect(this.options.databaseConfig.mongo.dbName);
    }

    /**
     * Connect top Mongo set up this.db
     *
     * @param dbName
     */
    connect (dbName: string): any{
        this._mongo.connect((err) => {

            if(err) {
                Log.error('Connection to Mongo has Failed')
            }

            Log.success("Connected successfully to Mongo server");

            this.db = this._mongo.db(dbName);
        });
    }

    /**
     * Set up Url mongo
     */
    private url(): string{

        if(! this.options.databaseConfig.mongo)
            throw new Error('No database Mongo config found!');

        let url = 'mongodb://';

        const user = this.options.databaseConfig.mongo.user;
        const password = this.options.databaseConfig.mongo.password;

        if(user){
            url += user;
            if(password)
                url += `:${password}@`;

            url += ":''@";
        }

        url += this.options.databaseConfig.mongo.host;
        url += `:${this.options.databaseConfig.mongo.port}`;

        return url;
    }


    /**
     * Store data to cache.
     */
    setMember(channel: string, member: any): void {
        Log.success(`MONGO SetMember on Channel: ${channel}, Member: ${JSON.stringify(member)}`)
        this.db.collection(channel).insertOne(member, (err, res) =>{
            if(err) {
                Log.error('Mongo SetMember ' + err.message)
            }
        });
    }

    /**
     * Store data to cache.
     */
    delMember(channel: string, member: any): void {
        Log.success(`MONGO DelMember on Channel: ${channel}, Member: ${JSON.stringify(member)}`)
        Log.success(`MONGO DElELETE Member  MemberID: ${member[0].user_id} , SOcketId: ${member[0].socketId}`)

        this.db.collection(channel).deleteOne({user_id: member[0].user_id}, (err, res) =>{
            if(err) {
                Log.error('Mongo DelMember ' + err.message)
            }

            Log.success(`MONGO Delete Member on Channel: ${channel}, RESPONSE: ${JSON.stringify(res)}`)
        });
    }

    /**
     * Retrieve data from redis.
     */
    isMember(channel: string, member: any): Promise<any> {
        Log.success(`MONGO IS_Member on Channel: ${channel}, Member: ${JSON.stringify(member)}`)
        return new Promise<any>((resolve, reject) => {
            this.db.collection(channel).find({user_id: member.user_id}).toArray((err, res) =>{
                if(err) {
                    Log.error('Mongo IsMember ' + err.message)
                    return reject(err)
                }
                return resolve(res)
            });
        });
    }

    /**
     * Retrieve data from redis.
     */
    getMember(channel: string, member: any): Promise<any> {
        Log.success(`MONGO GETMember on Channel: ${channel}, Member: ${JSON.stringify(member)}`)
        return new Promise<any>((resolve, reject) => {
            this.db.collection(channel).find({user_id: member.user_id}).toArray((err, res) =>{
                if(err) {
                    Log.error('Mongo IsMember ' + err.message)
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
        Log.success(`MONGO GETMember By Socket ID on Channel: ${channel}, soketId: ${JSON.stringify(socketId)}`)
        return new Promise<any>((resolve, reject) => {
            this.db.collection(channel).find({socketId: socketId}).toArray((err, res) =>{
                if(err) {
                    Log.error('Mongo getMemberBySocketId ' + err.message)
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
        Log.success(`MONGO GETMemberS on Channel: ${channel}`)
        return new Promise<any>((resolve, reject) => {
            this.db.collection(channel).find({}).toArray((err, res) =>{
                if(err) {
                    Log.error('Mongo getMembers ' + err.message)
                    return reject(err)
                }
                Log.success(`MONGO GET MEMBERS on Channel: ${channel}, Members: ${JSON.stringify(res)}`)
                return resolve(res)
            });
        });
    }

    /**
     * removeInactive
     *
     * @param channel
     * @param sockets array active io sockets on this channel
     */
    removeInactive(channel: string, sockets: any): Promise<any>{
        return new Promise((resolve, reject) => {
            this.db.collection(channel).deleteMany({socketId: { $nin: sockets }}, (err, res) => {
                if(err) return reject(err);
                return resolve();
            })
        });
    }
}
