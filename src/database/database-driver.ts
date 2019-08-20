/**
 * Interface for key/value data stores.
 */
export interface DatabaseDriver {
    /**
     * Get a value from the database.
     */
    get(key: string): Promise<any>;

    /**
     * Set a value to the database.
     */
    set(key: string, value: any): void;

    /**
     * get all members in channel
     */
    getMembers(key: string): Promise<any>;

    /**
     * is active member in channel
     */
    isMember(key: string, channel: string): Promise<any>;

    /**
     * Set active member in channel
     */
    setMember(key: string, value: any): void;

    /**
     * delete active member from channel
     */
    delMember(key: string, value: any): void;
}
