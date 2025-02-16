import {describe, before, after, it} from "mocha";
import {expect} from "chai";

import {MockLaravel} from "../mock_laravel";

const Echo = require("laravel-echo");

let io = require('socket.io-client');

const echo = require('../../index');
const options = echo.defaultOptions;

options.authHost = `http://localhost:${options.dev.mock.laravel_port}`;
options.devMode = true;
options.log = "file";
options.console_log = false;

const ioUrl = `${options.protocol}://${options.host}:${options.port}`;

const mockLaravel = new MockLaravel(options);

describe('Laravel Echo Auth Methods', function () {

    /** setup echo server and mock Laravel Server*/
    before(function (done) {
        echo.run(options).then(() => {
           mockLaravel.run().then(() => {
                return done();
            })
        })
    });

    /** stop mock Laravel Server*/
    after(function (done) {
        mockLaravel.stop();
        return done();
    });


    it('should Fail Authenticate with Bearer Token Header and should be disconnected', done => {

        let echo_client = new Echo({
            broadcaster: 'socket.io',
            host: ioUrl,
            client: io,
            transportOptions: {
                polling: {
                    extraHeaders: {
                        'Authorization': 'Bearer 11'
                    }
                }
            }
        });

        echo_client.connector.socket.on('disconnect', () => {
            expect(echo_client.connector.socket.connected).to.be.false;
            done();
        });
    });

    it('should Authenticate Correctly with Bearer Token Header', done => {

        let echo_client = new Echo({
            broadcaster: 'socket.io',
            host: ioUrl,
            client: io,
            transportOptions: {
                polling: {
                    extraHeaders: {
                        'Authorization': 'Bearer 1'
                    }
                }
            }
        });

        echo_client.connector.socket.on('connect', () => {
            expect(echo_client.connector.socket.connected).to.be.true;
            done();
        });
    })

    it('should Fail Authenticate with Query Token', done => {

        let echo_client = new Echo({
            broadcaster: 'socket.io',
            host: `${ioUrl}?token=332`,
            client: io,
        });

        echo_client.connector.socket.on('disconnect', () => {
            expect(echo_client.connector.socket.connected).to.be.false;
            done();
        });
    })

    it('should Authenticate Correctly with Query Token', done => {

        let echo_client = new Echo({
            broadcaster: 'socket.io',
            host: `${ioUrl}?token=2`,
            client: io,
        });

        echo_client.connector.socket.on('connect', () => {
            expect(echo_client.connector.socket.connected).to.be.true;
            done();
        });
    });

    it('should Fail Authenticate with Cookie Token', done => {

        let echo_client = new Echo({
            broadcaster: 'socket.io',
            host: ioUrl,
            client: io,
            transportOptions: {
                polling: {
                    extraHeaders: {
                        'Cookie': 'jwt_token=34444'
                    }
                }
            }
        });

        echo_client.connector.socket.on('disconnect', () => {
            expect(echo_client.connector.socket.connected).to.be.false;
            done();
        });
    });

    it('should Authenticate Correctly with Cookie Token', done => {

        let echo_client = new Echo({
            broadcaster: 'socket.io',
            host: ioUrl,
            client: io,
            transportOptions: {
                polling: {
                    extraHeaders: {
                        'Cookie': 'jwt_token=3'
                    }
                }
            }
        });

        echo_client.connector.socket.on('connect', () => {
            expect(echo_client.connector.socket.connected).to.be.true;
            done();
        });
    });


});
