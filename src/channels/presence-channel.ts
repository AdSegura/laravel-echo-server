var _ = require('lodash');
import { Channel } from './channel';
import { Database } from './../database';
import { Log } from './../log';

export class PresenceChannel {
    /**
     * Database instance.
     */
    db: Database;

    /**
     * Create a new Presence channel instance.
     */
    constructor(private io, private options: any, protected log: any) {
        this.db = new Database(this.options);
    }

    /**
     * Get the members of a presence channel.
     */
    getMembers(channel: string): Promise<any> {
        return this.db.getMembers(channel);
    }

    /**
     * Check if a user is on a presence channel.
     */
    isMember(channel: string, member: any): Promise<boolean> {
        Log.success(`Is Member channel: ${channel}, member ${JSON.stringify(member)}`);
        return new Promise((resolve, reject) => {
            this.db.isMember(channel, member).then(member => {
                Log.success(`Is member Mongo Response: ${JSON.stringify(member)}`);
                if(member) return resolve (true);
                return resolve(false);
            }).catch(e => reject(e))
        });
    }

    /**
     * Remove inactive channel members from the presence channel.
     *
     */
    removeInactive(channel: string): Promise<any> {

        return new Promise((resolve, reject) => {
            this.io.of('/').in(channel).clients((error, clients) => {
                Log.success(`Remove Inactive from Chnnel ${channel}, active Sockets from IO: ${clients}`)
                return this.db.removeInactive(channel, clients)
                    .then(() => {
                        return resolve()
                }).catch(e => reject(e))
            });
        });
    }

    /**
     * Join a presence channel and emit that they have joined only if it is the
     * first instance of their presence.
     */
    join(socket: any, channel: string, member: any) {
        if (!member) {
            Log.error('Unable to join channel. Member data for presence channel missing');
            return;
        }

        member.socketId = socket.id;

        this.removeInactive(channel).then(() => {
            this.isMember(channel, member).then(is_member => {
                this.getMembers(channel).then(members => {
                    members = members || [];
                    members.push(member);

                    Log.success(`On JOIN, DB set active MEMBERS: ${JSON.stringify(members)}`);

                    this.db.setMember(channel, member);

                    members = _.uniqBy(members.reverse(), 'user_id');

                    this.onSubscribed(socket, channel, members);

                    if (!is_member)
                        this.onJoin(socket, channel, member);

                }, error => Log.error(error));
            }, (e) => {
                Log.error('Error retrieving presence channel members ' + e.message);
            });
        }).catch(e => {
            Log.error('Error Remove Inactive presence channel ' + e.message);
        })
    }

    /**
     * Remove a member from a presenece channel and broadcast they have left
     * only if not other presence channel instances exist.
     */
    leave(socket: any, channel: string): void {
        Log.success(`Leave Presence Channel, SocketId:${socket.id}, channel:${channel}`)
        this.db.getMemberBySocketId(channel, socket.id).then(member => {
            if(member) {
                Log.success(`On JOIN getMemberBySocketId, channel:${channel}, MEMBER: ${JSON.stringify(member)}`)
                this.db.delMember(channel, member);
            }

            this.isMember(channel, member).then(is_member => {
                if (!is_member) {
                    delete member.socketId;
                    this.onLeave(channel, member);
                }
            });
        }, error => Log.error(error));
    }

    /**
     * On join event handler.
     */
    onJoin(socket: any, channel: string, member: any): void {
        Log.success(`On JOIN, SocketId:${socket.id}, channel:${channel}, MEMBER: ${JSON.stringify(member)}`)
        this.io
            .sockets
            .connected[socket.id]
            .broadcast
            .to(channel)
            .emit('presence:joining', channel, member);
    }

    /**
     * On leave emitter.
     */
    onLeave(channel: string, member: any): void {
        this.io
            .to(channel)
            .emit('presence:leaving', channel, member);
    }

    /**
     * On subscribed event emitter.
     */
    onSubscribed(socket: any, channel: string, members: any[]) {
        Log.success(`On SUBSCRIBED, Channel ${channel} io.to(${socket.id}).emit('presence:subscribed', channel, members): ${JSON.stringify(members)}`)
        this.io
            .to(socket.id)
            .emit('presence:subscribed', channel, members);
    }
}
