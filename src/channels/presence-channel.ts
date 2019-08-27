import {Logger} from "../log/logger";

var _ = require('lodash');
import { Database } from './../database';


export class PresenceChannel {
    private debug: any;

    /**
     * Create a new Presence channel instance.
     */
    constructor(private io, private options: any, protected log: Logger, protected db: Database) {
        this.debug = require('debug')(`server_${this.options.port}:presence-channel`);
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
        this.debug(`Is Member channel: ${channel}, member ${JSON.stringify(member)}`);
        return new Promise((resolve, reject) => {
            this.db.isMember(channel, member).then(res => {
                if(res) return resolve (true);
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
                this.debug(`Remove Inactive from Chnnel ${channel}, active Sockets from IO: ${clients}`)
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
            this.debug('Unable to join channel. Member data for presence channel missing');
            return;
        }

        member.socketId = socket.id;

        this.removeInactive(channel).then(() => {
            this.isMember(channel, member).then(is_member => {
                this.getMembers(channel).then(members => {
                    members = members || [];
                    members.push(member);

                    this.debug(`On JOIN, DB set active MEMBERS: ${JSON.stringify(members)}`);

                    this.db.setMember(channel, member);

                    members = _.uniqBy(members.reverse(), 'user_id');

                    this.onSubscribed(socket, channel, members);

                    if (!is_member)
                        this.onJoin(socket, channel, member);

                }, error => this.debug(error));
            }, (e) => {
                this.debug('Error retrieving presence channel members ' + e.message);
            });
        }).catch(e => {
            this.debug('Error Remove Inactive presence channel ' + e.message);
        })
    }

    /**
     * Remove a member from a presenece channel and broadcast they have left
     * only if not other presence channel instances exist.
     */
    leave(socket: any, channel: string): void {
        this.debug(`Leave Presence Channel, SocketId:${socket.id}, channel:${channel}`)
        this.db.getMemberBySocketId(channel, socket.id).then(member => {
            if(member) {
                this.debug(`On JOIN getMemberBySocketId, channel:${channel}, MEMBER: ${JSON.stringify(member)}`)
                this.db.delMember(channel, member);
            }

            this.isMember(channel, member).then(is_member => {
                if (!is_member) {
                    delete member.socketId;
                    this.onLeave(channel, member);
                }
            });
        }, error => this.debug(error));
    }

    /**
     * On join event handler.
     */
    onJoin(socket: any, channel: string, member: any): void {
        this.debug(`On JOIN, SocketId:${socket.id}, channel:${channel}, MEMBER: ${JSON.stringify(member)}`)
        //console.error(this.io.sockets)
        if(! this.io.sockets.connected[socket.id]) return;
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
        this.debug(`On SUBSCRIBED, Channel ${channel} io.to(${socket.id}).emit('presence:subscribed', channel, members): ${JSON.stringify(members)}`)
        this.io
            .to(socket.id)
            .emit('presence:subscribed', channel, members);
    }
}
