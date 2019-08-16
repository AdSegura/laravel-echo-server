import {describe, before, after, it} from "mocha";
//import {Log} from "../../log";
import {MockLaravel} from "../mock_laravel";

const Echo = require("laravel-echo")

const io = require('socket.io-client');

const mocha = require('mocha');
const chai = require('chai');
const expect = require('expect');


const echo = require('../../index');
const options = echo.defaultOptions;

options.authHost =  `http://localhost:${options.dev.mock.laravel_port}`;
options.devMode  =  true;
options.log  =  "file";

const mockLaravel = new MockLaravel(options);


describe('basic socket.io example', function() {

    var socket;

    before(function (done) {
        echo.run(options).then(() => {
            mockLaravel.run().then(() => {
                return done();
            })
        })
    });

    after(function (done) {
        //echo.stop();
        mockLaravel.stop();
        return done();
    });


it('should Fail Auth and Disconnected', done => {

    let echo_client = new Echo({
        broadcaster: 'socket.io',
        host: 'http://localhost:4000',
        auth: {headers: {Authorization: 'Bearer ' + 'foo' }},
        client: io
    });

    /*echo_client.connector.socket.on('connect', () => {

    });*/

    echo_client.connector.socket.on('disconnect', () => {
        done();
    });
})

    /*
    beforeEach(function(done) {
        // Setup
        socket = io.connect('http://localhost:4000', {
            'reconnection delay' : 0
            , 'reopen delay' : 0
            , 'force new connection' : true
            , transports: ['websocket']
        });

        socket.on('connect', () => {
            done();
        });

        socket.on('disconnect', () => {
            // console.log('disconnected...');
        });
    });*/
  /*  it('should communicate', (done) => {
        // once connected, emit Hello World
        io_server.emit('echo', 'Hello World');

        socket.once('echo', (message) => {
            // Check that the message matches
            expect(message).to.equal('Hello World');
            done();
        });

        io_server.on('connection', (socket) => {
            expect(socket).to.not.be.null;
        });
    });*/

});
