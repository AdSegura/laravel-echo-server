import { DatabaseDriver } from './database-driver';
import {Log} from "../log";
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost';
const dbName = 'presence';

export class MongoDatabase implements DatabaseDriver {
    /**
     * Redis client.
     */
    private _mongo: any;
    private presence_channel: any;
    private db: any;

    /**
     * Create a new cache instance.
     */
    constructor(private options) {
        this._mongo = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
        this.connect(dbName);
    }

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
     * Retrieve data from redis.
     */
    get(key: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._mongo.get(key).then(value => resolve(JSON.parse(value)));
        });
    }

    /**
     * Store data to cache.
     */
    set(key: string, value: any): void {

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
