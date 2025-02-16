import {PresenceChannel} from './presence-channel';
import {PrivateChannel} from './private-channel';
import {Log} from './../log';
import {RootChannel} from "./rootChannel";

export class Channel {
    /**
     * Channels and patters for private channels.
     */
    protected _privateChannels: string[] = ['private-*', 'presence-*'];

    /**
     * Allowed client events
     */
    protected _clientEvents: string[] = ['client-*'];

    /**
     * Private channel instance.
     */
    private: PrivateChannel;

    /**
     * Presence channel instance.
     */
    presence: PresenceChannel;

    /**
     * Root NSP /
     */
    rootChannel: RootChannel;

    /**
     * Create a new channel instance.
     */
    constructor(private io, private options, protected log) {

        this.private = new PrivateChannel(options, this.log);
        this.rootChannel = new RootChannel(options, this.log);
        this.presence = new PresenceChannel(io, options, this.log);

        Log.success('Channels are ready.');

    }

    /**
     * Join a channel.
     */
    join(socket, data): void {
        if (data.channel) {
            if (this.isPrivate(data.channel)) {
                this.joinPrivate(socket, data);
            } else {
                socket.join(data.channel);
                this.onJoin(socket, data.channel);
            }
        }
    }

    /**
     * Trigger a client message
     */
    clientEvent(socket, data): void {
        if (data.event && data.channel) {
            if (this.isClientEvent(data.event) &&
                this.isPrivate(data.channel) &&
                this.isInChannel(socket, data.channel)) {
                this.io.sockets.connected[socket.id]
                    .broadcast.to(data.channel)
                    .emit(data.event, data.channel, data.data);
            }
        }
    }

    /**
     * Leave a channel.
     */
    leave(socket: any, channel: string, reason: string): void {
        if (channel) {
            if (this.isPresence(channel)) {
                this.presence.leave(socket, channel)
            }

            socket.leave(channel);


            Log.info(`[${new Date().toLocaleTimeString()}] - ${socket.id} left channel: ${channel} (${reason})`);

        }
    }

    /**
     * Check if the incoming socket connection is a private channel.
     */
    isPrivate(channel: string): boolean {
        let isPrivate = false;

        this._privateChannels.forEach(privateChannel => {
            let regex = new RegExp(privateChannel.replace('\*', '.*'));
            if (regex.test(channel)) isPrivate = true;
        });

        return isPrivate;
    }

    /**
     * Join Root channel
     */
    joinRoot(socket: any): Promise<any> {
        return this
            .rootChannel
            .authenticate(socket)

    }


    /**
     * Join private channel, emit data to presence channels.
     */
    joinPrivate(socket: any, data: any): void {
        this.private.authenticate(socket, data).then(res => {

            socket.join(data.channel);

            if (this.isPresence(data.channel)) {

                Log.success('Join Private Is Presence Channel: ' + data.channel);

                let member = res.channel_data;

                this.presence.join(socket, data.channel, member);
            }

            this.onJoin(socket, data.channel);

        }, error => {
            Log.error(error.reason);
            this.io.sockets.to(socket.id)
                .emit('subscription_error', data.channel, error.status);
        });
    }

    /**
     * Check if a channel is a presence channel.
     */
    isPresence(channel: string): boolean {
        return channel.lastIndexOf('presence-', 0) === 0;
    }

    /**
     * On join a channel log success.
     */
    onJoin(socket: any, channel: string): void {

        Log.info(`[${new Date().toLocaleTimeString()}] - ${socket.id} joined channel: ${channel}`);

    }

    /**
     * Check if client is a client event
     */
    isClientEvent(event: string): boolean {
        let isClientEvent = false;

        this._clientEvents.forEach(clientEvent => {
            let regex = new RegExp(clientEvent.replace('\*', '.*'));
            if (regex.test(event)) isClientEvent = true;
        });

        return isClientEvent;
    }

    /**
     * Check if a socket has joined a channel.
     */
    isInChannel(socket: any, channel: string): boolean {
        return !!socket.rooms[channel];
    }
}
