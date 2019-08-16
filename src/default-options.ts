const {constants} = require('crypto');

export const options = {
    "app_name": "myApp",
    "authHost": "http://localhost",
    "authEndpoint": "/broadcasting/auth",
    "clients": [],
    "database": "redis",
    "databaseConfig": {
        "redis": {},
        "sqlite": {
            "databasePath": "/dist/database/laravel-echo-server.sqlite"
        }
    },
    "devMode": false,
    "testMode": false,
    "host": null,
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
    "log": "file",
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
    }
};
