import {describe, before, after, it} from "mocha";
import {expect} from "chai";
import {MockLaravel} from "../mock_laravel";
import {EchoClientFactory} from "../echoClientFactory";
import {EchoServerFactory} from "../echoServerFactory";
const echo = require('../../index');


/**
 * Presence channel Test
 *
 * we can listen for events with socket.io directly
 *  echo_client.connector.socket.on('presence:joining', (channel, data)
 */
describe('Presence Channel Tests same Echo server', function () {
    let echo_server;

    const options = echo.defaultOptions;

    const ioUrl = `${options.protocol}://${options.host}:${options.port}`;

    const mockLaravel = new MockLaravel(options);

    /** setup echo server and mock Laravel Server*/
    before(function (done) {
        let E1 = new EchoServerFactory(4000, {console_log: false, log: "syslog"});
        E1.start()
            .then(server => {
                echo_server = server;
                mockLaravel.run().then(() => {
                    return done();
                })

            });

    });

    /** stop mock Laravel Server*/
    after(function (done) {
        mockLaravel.stop();
        echo_server.stopServer()
        done();
    });


    it('should join two clients on presence channel, first client should receive a joining event', done => {

        const echo_client = EchoClientFactory.echoClient(1, ioUrl);

        echo_client.join(`chat`)
            .joining((user) => {
                expect(user).to.have.property('id').to.equal(2);
                expect(user).to.have.property('name');
                done();
            });

        const echo_client1 = EchoClientFactory.echoClient(2, ioUrl);

        setTimeout(() => {

            echo_client1.join(`chat`)

        }, 1000)

    }).timeout(5000)

});
