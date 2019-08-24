const {constants} = require('crypto');

export const options = {
    "app_name": "myApp",
    "authHost": "http://localhost",
    "authEndpoint": "/broadcasting/auth",
    "clients": [],
    "cluster": {
        "adapter": {
            "redis": { // Redis instance MUST be different than Echo-Laravel Redis instance
                "port": "6379",
                "host": "redis.local"
            }
        }
    },
    "databaseConfig": {
        "mongo": {
            "host": "127.0.0.1",
            "port": "27017",
            "dbName": "echo",
            "user": null,
            "password": null
        },
    },
    "devMode": true,
    "testMode": false,
    "host": 'localhost',
    "port": 6001,
    "protocol": "http",
    "socketio": {},
    "secureOptions": constants.SSL_OP_NO_TLSv1,
    "sslCertPath": "",
    "sslKeyPath": "",
    "sslCertChainPath": "",
    "sslPassphrase": "",
    "subscribers": {
        "http": true,
        "redis": true
    },
    "apiOriginAllow": {
        "allowCors": false,
        "allowOrigin": "",
        "allowMethods": "",
        "allowHeaders": ""
    },
    "multiple_sockets": true,
    "command_channel": "private-echo.server.commands",
    "log": "syslog",
    "log_folder": "../../logs/",
    "syslog": {
        "host": "127.0.0.1",
        "port": "514",
        "facility": "local0",
        "type": "sys"
    },
    "dev": {
        "mock": {
            "laravel_port": 7718
        }
    },
    "console_log": true,
    "behind_proxy": false
};
