import { DatabaseDriver } from './database-driver';
import {MongoDatabase} from "./mongo";
import {Logger} from "../log/logger";

/**
 * Class that controls the key/value data store.
 */
export class Database implements DatabaseDriver {
    /**
     * Database driver.
     */
    private driver: DatabaseDriver;

    /**
     * Create a new Mongo database instance.
     */
    constructor(private options: any, protected log: Logger) {
        this.driver = new MongoDatabase(this.options, this.log);
    }


    getMembers(key: string): Promise<any> {
        return this.driver.getMembers(key);
    };

    getMember(key: string, value: any): Promise<any> {
        return this.driver.isMember(key, value);
    };

    isMember(key: string, value: any): Promise<any> {
       return this.driver.isMember(key, value);
    };

    setMember(key: string, value: any): void {
        this.driver.setMember(key, value);
    };

    delMember(key: string, value: any): void {
        this.driver.delMember(key, value);
    };

    getMemberBySocketId(channel: string, member: any): Promise<any>{
        return this.driver.getMemberBySocketId(channel, member);
    }

    removeInactive(channel: string, member: any): Promise<any>{
        return this.driver.removeInactive(channel, member);
    }

    removeInactiveSocketsInThisServer(collection: string, sockets: any): Promise<any>{
        return this.driver.removeInactiveSocketsInThisServer(collection, sockets);
    }

    setUserInServer(collection: string, user: any): void{
        return this.driver.setUserInServer(collection, user);
    };

    delUserInServerBySocketId(collection: string, socket_id: any): void {
        return this.driver.delUserInServerBySocketId(collection, socket_id);
    }
}
