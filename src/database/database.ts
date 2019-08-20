import { DatabaseDriver } from './database-driver';
import { RedisDatabase } from './redis';
import { Log } from './../log';

/**
 * Class that controls the key/value data store.
 */
export class Database implements DatabaseDriver {
    /**
     * Database driver.
     */
    private driver: DatabaseDriver;

    /**
     * Create a new database instance.
     */
    constructor(private options: any) {
        this.driver = new RedisDatabase(options);
    }

    /**
     * Get a value from the database.
     */
    get(key: string): Promise<any> {
        return this.driver.get(key)
    };

    /**
     * Set a value to the database.
     */
    set(key: string, value: any): void {
        this.driver.set(key, value);
    };

    getMembers(key: string): Promise<any> {
        return this.driver.getMembers(key);
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
}
