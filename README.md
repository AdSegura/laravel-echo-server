# Laravel Echo Server Fork 

#### Laravel Echo 1.5.7 Adseg New Features:

* Auth user on connect event (closing socket if fails to)
* JWT Cookie Auth
* JWT query ?token= Auth 
* one or multiple sockets allowed
* syslog | file logging
* close user's sockets from Laravel
* kickOff users from channels

### new Options Added
```json
{
    "app_name": "myApp",
    "command_channel": "private-echo.server.commands",
    "log": "file",
    "log_folder": "../../logs/",
    "syslog": {
        "host": "127.0.0.1",
        "port": "514",
        "facility": "local0",
        "type": "sys"
    },
    "multiple_sockets": false,
    "console_log": true,
    "behind_proxy": false
}
```

##### app_name:
For logging purpose.

##### command_channel:
Name for the channel, Echo and Laravel will use, to communicate commands.

##### log:
This option will define where logs are send.
* file
* syslog

##### log_folder:
file logs folder 

##### syslog:
Syslog configuration options
* host
* port
* facility
* type
    * sys
    * upd
    * tcp
    
##### multiple_sockets:
Allow multiple sockets per user.
* true
* false

##### console_log:
Allow to silent console.log output for cleaner test output
* true
* false

##### behind_proxy:
If Echo is behind a proxy will get the client's Ip from X-forward headers.
* true
* false

# Laravel backend 
##### routes/channels.php
```php
Broadcast::channel('root', AuthSocket::class);
```
##### Broadcasting/AuthSocket.php
```php
public function join(User $user)
{
    if((int) $user->id !== (int) Auth::user()->id)
        return false;
       
    $multiple_sockets = request()->input('multiple_sockets');
       
    if($multiple_sockets == false) {
        $user->disconnect();
    }
       
    return $user->id;
}
```
#### If only allow one socket per user
You have to create new Event on Laravel

###### Events/EchoServerCommand.php
```php
class EchoServerCommand implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $command;

    protected $channel = 'echo.server.commands';

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct($command)
    {
        $this->command = $command;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new PrivateChannel($this->channel);
    }
}
```

##### User.php

```php
public function disconnect()
{
    event(new EchoServerCommand([
        "execute" => "close_socket",
        "data" => $this->id
    ]));

    return $this;
}
```

#### Http Api Kickoff User by Id
```sh
http POST ":4000/apps/:appID/channels/leave/:channelName/user/:user_id?auth_key=:auth_key"
```

#### Rsyslog Server Conf example

Make rsyslog listen localhost:514:udp
 
##### rsyslogd.conf 
```sh
#################
#### MODULES ####
#################

module(load="imuxsock") # provides support for local system logging
#module(load="immark")  # provides --MARK-- message capability

# provides UDP syslog reception
module(load="imudp")
input(type="imudp" port="514" Address="127.0.0.1")
```

Route laravel-echo-server logs to myapp.log file

##### rsyslog.d/01-myapp.conf
```sh
template(name="bunyan" type="string"
         string="%msg:R,ERE,1,FIELD:(\\{.*\\})--end%\n")

:programname, isequal, "laravel-echo-server" {
  *.* /var/log/myapp.log;bunyan
  stop
}
``` 

##### Now you can use bunyan to parse logs 
```sh
node_modules/bunyan/bin/bunyan /var/log/myapp.log
```

## Tests 
```sh
$> npm run build && npm run test
```

### Laravel Echo Auth and Message Flow
![Auth Flow, Message Flow](laravelEcho.png)


# Official Laravel Echo Server Doc 1.5.7


NodeJs server for Laravel Echo broadcasting with Socket.io.

## System Requirements

The following are required to function properly.

*   Laravel 5.3
*   Node 6.0+
*   Redis 3+

Additional information on broadcasting with Laravel can be found on the
official docs: <https://laravel.com/docs/master/broadcasting>

## Getting Started

Install npm package globally with the following command:

``` shell
$   npm install -g laravel-echo-server
```

### Initialize with CLI Tool

Run the init command in your project directory:

``` shell
$   laravel-echo-server init
```

The cli tool will help you setup a **laravel-echo-server.json** file in the root directory of your project. This file will be loaded by the server during start up. You may edit this file later on to manage the configuration of your server.

#### API Clients

The Laravel Echo Server exposes a light http API to perform broadcasting functionality. For security purposes, access to these endpoints from http referrers must be authenticated with an API id and key. This can be generated using the cli command:

``` shell
$ laravel-echo-server client:add APP_ID
```

If you run `client:add` without an app id argument, one will be generated for you. After running this command, the client id and key will be displayed and stored in the **laravel-echo-server.json** file.

In this example, requests will be allowed as long as the app id and key are both provided with http requests.

``` http
Request Headers

Authorization:  Bearer skti68i...

or

http://app.dev:6001/apps/APP_ID/channels?auth_key=skti68i...
```

You can remove clients with `laravel-echo-server client:remove APP_ID`

#### Run The Server

in your project root directory, run

``` shell
$ laravel-echo-server start
```

#### Stop The Server

in your project root directory, run

``` shell
$ laravel-echo-server stop
```

### Configurable Options

Edit the default configuration of the server by adding options to your **laravel-echo-server.json** file.


| Title              | Default              | Description                 |
| :------------------| :------------------- | :---------------------------|
| `apiOriginAllow`   | `{}`                 | Configuration to allow API be accessed over CORS. [Example](#cross-domain-access-to-api) |
| `authEndpoint`     | `/broadcasting/auth` | The route that authenticates private channels  |
| `authHost`         | `http://localhost`   | The host of the server that authenticates private and presence channels  |
| `database`         | `redis`              | Database used to store data that should persist, like presence channel members. Options are currently `redis` and `sqlite` |
| `databaseConfig`   |  `{}`                | Configurations for the different database drivers [Example](#database) |
| `devMode`          | `false`              | Adds additional logging for development purposes |
| `host`             | `null`               | The host of the socket.io server ex.`app.dev`. `null` will accept connections on any IP-address |
| `port`             | `6001`               | The port that the socket.io server should run on |
| `protocol`         | `http`               | Must be either `http` or `https` |
| `sslCertPath`      | `''`                 | The path to your server's ssl certificate |
| `sslKeyPath`       | `''`                 | The path to your server's ssl key |
| `sslCertChainPath` | `''`                 | The path to your server's ssl certificate chain |
| `sslPassphrase`    | `''`                 | The pass phrase to use for the certificate (if applicable) |
| `socketio`         | `{}`                 | Options to pass to the socket.io instance ([available options](https://github.com/socketio/engine.io#methods-1)) |
| `subscribers`      | `{"http": true, "redis": true}` | Allows to disable subscribers individually. Available subscribers: `http` and `redis` |

### DotEnv
If a .env file is found in the same directory as the laravel-echo-server.json
file, the following options can be overridden:

- `authHost`: `LARAVEL_ECHO_SERVER_AUTH_HOST` *Note*: This option will fall back to the `LARAVEL_ECHO_SERVER_HOST` option as the default if that is set in the .env file.
- `host`: `LARAVEL_ECHO_SERVER_HOST`
- `port`: `LARAVEL_ECHO_SERVER_PORT`
- `devMode`: `LARAVEL_ECHO_SERVER_DEBUG`
- `databaseConfig.redis.host`: `LARAVEL_ECHO_SERVER_REDIS_HOST`
- `databaseConfig.redis.port`: `LARAVEL_ECHO_SERVER_REDIS_PORT`
- `databaseConfig.redis.password`: `LARAVEL_ECHO_SERVER_REDIS_PASSWORD`


### Running with SSL

*   Your client side implementation must access the socket.io client from https.
*   The server configuration must set the server host to use https.
*   The server configuration should include paths to both your ssl certificate and key located on your server.

*Note: This library currently only supports serving from either http or https, not both.*

#### Alternative SSL implementation
If you are struggling to get SSL implemented with this package, you could look at using a proxy module within Apache or NginX. Essentially, instead of connecting your websocket traffic to https://yourserver.dev:6001/socket.io?..... and trying to secure it, you can connect your websocket traffic to https://yourserver.dev/socket.io. Behind the scenes, the proxy module of Apache or NginX will be configured to intercept requests for /socket.io, and internally redirect those to your echo server over non-ssl on port 6001. This keeps all of the traffic encrypted between browser and web server, as your web server will still do the SSL encryption/decryption. The only thing that is left unsecured is the traffic between your webserver and your Echo server, which might be acceptable in many cases.
##### Sample NginX proxy config
```
#the following would go within the server{} block of your web server config
location /socket.io {
	    proxy_pass http://laravel-echo-server:6001; #could be localhost if Echo and NginX are on the same box
	    proxy_http_version 1.1;
	    proxy_set_header Upgrade $http_upgrade;
	    proxy_set_header Connection "Upgrade";
	}
```

### Setting the working directory
The working directory in which `laravel-echo-server` will look for the configuration file `laravel-echo-server.json` can be passed to the `start` command through the `--dir` parameter like so: `laravel-echo-server start --dir=/var/www/html/example.com/configuration`

## Subscribers
The Laravel Echo Server subscribes to incoming events with two methods: Redis & Http.

### Redis

 Your core application can use Redis to publish events to channels. The Laravel Echo Server will subscribe to those channels and broadcast those messages via socket.io.

### Http

Using Http, you can also publish events to the Laravel Echo Server in the same fashion you would with Redis by submitting a `channel` and `message` to the broadcast endpoint. You need to generate an API key as described in the [API Clients](#api-clients) section and provide the correct API key.

**Request Endpoint**

``` http
POST http://app.dev:6001/apps/your-app-id/events?auth_key=skti68i...

```

**Request Body**

``` json

{
  "channel": "channel-name",
  "name": "event-name",
  "data": {
      "key": "value"
  },
  "socket_id": "h3nAdb134tbvqwrg"
}

```

**channel** - The name of the channel to broadcast an event to. For private or presence channels prepend `private-` or `presence-`.
**channels** - Instead of a single channel, you can broadcast to an array of channels with 1 request.
**name** - A string that represents the event key within your app.
**data** - Data you would like to broadcast to channel.
**socket_id (optional)** - The socket id of the user that initiated the event. When present, the server will only "broadcast to others".

### Pusher

The HTTP subscriber is compatible with the Laravel Pusher subscriber. Just configure the host and port for your Socket.IO server and set the app id and key in config/broadcasting.php. Secret is not required.

```php
 'pusher' => [
    'driver' => 'pusher',
    'key' => env('PUSHER_KEY'),
    'secret' => null,
    'app_id' => env('PUSHER_APP_ID'),
    'options' => [
        'host' => 'localhost',
        'port' => 6001,
        'scheme' => 'http'
    ],
],
```

You can now send events using HTTP, without using Redis. This also allows you to use the Pusher API to list channels/users as described in the [Pusher PHP library](https://github.com/pusher/pusher-http-php)

## HTTP API
The HTTP API exposes endpoints that allow you to gather information about your running server and channels.

**Status**
Get total number of clients, uptime of the server, and memory usage.

``` http
GET /apps/:APP_ID/status
```
**Channels**
List of all channels.

``` http
GET /apps/:APP_ID/channels
```
**Channel**
Get information about a particular channel.

``` http
GET /apps/:APP_ID/channels/:CHANNEL_NAME
```
**Channel Users**
List of users on a channel.
``` http
GET /apps/:APP_ID/channels/:CHANNEL_NAME/users
```

## Cross Domain Access To API
Cross domain access can be specified in the laravel-echo-server.json file by changing `allowCors` in `apiOriginAllow` to `true`. You can then set the CORS Access-Control-Allow-Origin, Access-Control-Allow-Methods as a comma separated string (GET and POST are enabled by default) and the Access-Control-Allow-Headers that the API can receive.

Example below:

``` json
{
  "apiOriginAllow":{
    "allowCors" : true,
    "allowOrigin" : "http://127.0.0.1",
    "allowMethods" : "GET, POST",
    "allowHeaders" : "Origin, Content-Type, X-Auth-Token, X-Requested-With, Accept, Authorization, X-CSRF-TOKEN, X-Socket-Id"
  }
}

```
This allows you to send requests to the API via AJAX from an app that may be running on the same domain but a different port or an entirely different domain.

## Database

To persist presence channel data, there is support for use of Redis or SQLite as a key/value store. The key being the channel name, and the value being the list of presence channel members.

Each database driver may be configured in the **laravel-echo-server.json** file under the `databaseConfig` property. The options get passed through to the database provider, so developers are free to set these up as they wish.

### Redis
For example, if you wanted to pass a custom configuration to Redis:

``` json

{
  "databaseConfig" : {
    "redis" : {
      "port": "3001",
      "host": "redis.app.dev"
    }
  }
}

```
*Note: No scheme (http/https etc) should be used for the host address*

*A full list of Redis options can be found [here](https://github.com/luin/ioredis/blob/master/API.md#new-redisport-host-options).*

### SQLite
With SQLite you may be interested in changing the path where the database is stored:

``` json
{
  "databaseConfig" : {
    "sqlite" : {
      "databasePath": "/path/to/laravel-echo-server.sqlite"
    }
  }
}
```

***Note: [node-sqlite3](https://github.com/mapbox/node-sqlite3) is required for this database. Please install before using.***

```
npm install sqlite3 -g
```

## Presence Channels

When users join a presence channel, their presence channel authentication data is stored using Redis.

While presence channels contain a list of users, there will be instances where a user joins a presence channel multiple times. For example, this would occur when opening multiple browser tabs. In this situation "joining" and "leaving" events are only emitted to the first and last instance of the user.

Optionally, you can configure laravel-echo-server to publish an event on each update to a presence channel, by setting `databaseConfig.publishPresence` to `true`:

```json
{
  "database": "redis",
  "databaseConfig": {
    "redis" : {
      "port": "6379",
      "host": "localhost"
    },
    "publishPresence": true
  }
}
```
You can use Laravel's Redis integration, to trigger Application code from there:
```php
Redis::subscribe(['PresenceChannelUpdated'], function ($message) {
    var_dump($message);
});
```


## Client Side Configuration

See the official Laravel documentation for more information. <https://laravel.com/docs/master/broadcasting#introduction>

### Tips
#### Socket.io client library
You can include the socket.io client library from your running server. For example, if your server is running at `app.dev:6001` you should be able to
add a script tag to your html like so:

```
<script src="//app.dev:6001/socket.io/socket.io.js"></script>
```

_Note: When using the socket.io client library from your running server, remember to check that the `io` global variable is defined before subscribing to events._

#### µWebSockets deprecation

µWebSockets has been [officially deprecated](https://www.npmjs.com/package/uws). Currently there is no support for µWebSockets in Socket.IO, but it may have the new [ClusterWS](https://www.npmjs.com/package/@clusterws/cws) support incoming. Meanwhile Laravel Echo Server will use [`ws` engine](https://www.npmjs.com/package/ws) by default until there is another option.
