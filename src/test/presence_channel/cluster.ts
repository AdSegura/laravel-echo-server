import {describe, before, after, it} from "mocha";
import {expect} from "chai";
import {MockLaravel} from "../mock_laravel";
import {EchoServerFactory} from "../echoServerFactory";
import {EchoClientFactory} from "../echoClientFactory";
const echo = require('../../index');

describe('Presence Channel Tests Cluster Mode', function () {
    let echo_server;
    let echo_server1;

    const options = echo.defaultOptions;

    const port = 2222;
    const port1 = 1111;

    const ioUrl = `${options.protocol}://${options.host}:${port}`;
    const ioUrl1 = `${options.protocol}://${options.host}:${port1}`;

    const mockLaravel = new MockLaravel(options);

    /** setup echo server and mock Laravel Server*/
    before(function (done) {
        let E1 = new EchoServerFactory(port, {console_log: false, log: "syslog"});
        E1.start()
            .then(server => {
                echo_server = server;

            });

        let E2 = new EchoServerFactory(port1, {console_log: false, log: "syslog"});
        E2.start().then(server1 => {
            echo_server1 = server1;
            mockLaravel.run().then(() => {
                return done();
            })
        })

    });

    /** stop mock Laravel Server*/
    after(function (done) {
        mockLaravel.stop();
        echo_server.stopServer();
        echo_server1.stopServer();
        return done();
    });

    it('should join two clients on presence channel, first client should receive a joining event', done => {

        const echo_client = EchoClientFactory.echoClient(1, ioUrl);

        echo_client.join(`chat`)
            .joining((user) => {
                expect(echo_client.connector._defaultOptions).to.have.property('host').to.equal(ioUrl);
                expect(echo_client1.connector._defaultOptions).to.have.property('host').to.equal(ioUrl1);
                expect(user).to.have.property('id').to.equal(2);
                expect(user).to.have.property('name').to.equal('luser');
                done();
            });


        const echo_client1 = EchoClientFactory.echoClient(2, ioUrl1);

        setTimeout(() => {
            echo_client1.join(`chat`)
        }, 2000)

    }).timeout(3000);

});
