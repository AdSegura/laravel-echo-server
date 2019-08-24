const Echo = require("laravel-echo");
const io = require('socket.io-client');

export class EchoClientFactory {

    static echoClient(id: number, url: string): any{
        return new Echo({
            broadcaster: 'socket.io',
            host: url,
            client: io,
            transportOptions: {
                polling: {
                    extraHeaders: {
                        'Authorization': `Bearer ${id}`
                    }
                }
            }
        });
    }
}
