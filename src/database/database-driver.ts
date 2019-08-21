/**
 * Interface for key/value data stores.
 */
export interface DatabaseDriver {

    /**
     * get all members in channel
     */
    getMembers(key: string): Promise<any>;

    /**
     * get a member in channel
     */
    getMember(key: string, value: any): Promise<any>;

    /**
     * get member from presence channel by socket id
     * @param channel
     * @param member
     */
    getMemberBySocketId(channel: string, member: any): Promise<any>;

    /**
     * is active member in channel
     */
    isMember(key: string, value: any): Promise<any>;

    /**
     * Set active member in channel
     */
    setMember(key: string, value: any): void;

    /**
     * delete active member from channel
     */
    delMember(key: string, value: any): void;


    /**
     * Remove inactive sockets
     *
     * will remove all entries where not in sockets
     *
     * @param channel
     * @param sockets array, active array socketsId on Io Channel
     */
    removeInactive(channel: string, sockets: any): Promise<any>;
}
