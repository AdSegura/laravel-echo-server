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

describe('Laravel Echo Multiple Sockets not Allowed', function () {

    const mockLaravel = new MockLaravel(options);

    /** setup echo server and mock Laravel Server*/
    before(function (done) {
        options.multiple_sockets = false;
        echo.run(options).then(() => {
            mockLaravel.run().then(() => {
                return done();
            })
        })
    });

    /** stop mock Laravel Server*/
    after(function (done) {
        mockLaravel.stop();
        echo.stop().then(() => {
            return done();
        })
    });


    it('Second Connection to Echo Server is not allowed with multiple_sockets = false', done => {

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
        });

        echo_client.connector.socket.on('disconnect', () => {
            expect(echo_client.connector.socket.connected).to.be.false;
            //return done();
        });

        setTimeout(() => {
            let echo_client1 = new Echo({
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

            echo_client1.connector.socket.on('connect', () => {
                expect(echo_client1.connector.socket.connected).to.be.true;
                setTimeout(() => {
                    expect(echo_client.connector.socket.connected).to.be.false;
                    done()
                }, 1000)
            });
        }, 2000)


    }).timeout(5000)
});

describe('Laravel Echo Multiple Sockets Allowed', function () {

    const mockLaravel = new MockLaravel(options);

    /** setup echo server and mock Laravel Server*/
    before(function (done) {
        options.multiple_sockets = true;
        echo.run(options).then(() => {
            mockLaravel.run().then(() => {
                return done();
            })
        })
    });

    /** stop mock Laravel Server*/
    after(function (done) {
        mockLaravel.stop();
        echo.stop().then(() => {
            return done();
        })
    });


    it('Second Connection to Echo Server is allowed with multiple_sockets = true', done => {

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
        });


        setTimeout(() => {
            let echo_client1 = new Echo({
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

            echo_client1.connector.socket.on('connect', () => {
                expect(echo_client1.connector.socket.connected).to.be.true;
                setTimeout(() => {
                    expect(echo_client.connector.socket.connected).to.be.true;
                    done()
                }, 1000)
            });
        }, 2000)

    }).timeout(5000)
});
