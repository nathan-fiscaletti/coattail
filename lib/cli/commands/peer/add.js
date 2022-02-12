const Peer = require(`../../../peer`);
const Client = require(`../../../client`);
const { connect } = require(`../../../data/connection`);
const c = require('ansi-colors');
const log = require(`../../../log`);

const commandLineArgs = require('command-line-args');

module.exports = (cli) => {
    const options = commandLineArgs([
        { name: "help", alias: "h", type: Boolean },
        { name: "token", alias: "t" }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
            {
                header: 'Coattail -- Add Peer',
                content: 'Registers a new peer to this Coattail instance.'
            },
            {
                header: 'Usage',
                content: [
                    `$ coattail peer add [options]`
                ]
            },
            {
                header: 'Options',
                optionList: [
                    {
                        name: 'help',
                        alias: 'h',
                        description: 'Shows this help message.',
                        type: Boolean
                    },
                    {
                        name: 'token',
                        alias: 't',
                        description: 'The JWT token issued by the peer.'
                    }
                ]
            }
        ]);
        return;
    }

    // Validate token
    if (!options.token) {
        cli.missing('token');
        return;
    }

    // Verify that the token was not issued by this coattail instance.
    const peer = new Peer(options.token);
    if (!peer.isValid()) {
        console.error(`${c.red('Error')}: Invalid token.`);
        return;
    }

    const config = require(`../../../server/config`).load();
    if (peer.getIssuer() == Peer.getTokenIssuer(config)) {
        console.error(`${c.red('Error')}: Cannot add peers using tokens issued by this instance.`);
        console.error(`       See docs/token_issuance.md for more information.`);
        return;
    }

    // Verify that we can connect to the peer, and that we are able to properly
    // authenticate with it.
    const client = Client.connect(peer, log('').silent());
    client
        .on('error', (err) => {
            const clientConfig = peer.getClientConfig();
            console.error(`${c.red('Error')}: Unable to add peer. Failed to connect to peer ${c.bold(`${clientConfig.tls ? 'TLS ' : ''}${clientConfig.host}:${clientConfig.port}`)}`);
            console.error(`${c.red('Error')}: Verify that the peer associated with the token you're attempting to use is currently running.`);
            console.error(`${c.red('Error')}: ${err}`);
            client.disconnect();
        })
        .on('auth-failed', () => {
            console.error(`${c.red('Error')}: Unable to add peer. Token does not contain a valid signature.`);
            console.error(`        Verify that the token you are attempting to use has not been tampered with and is not expired.`);
            client.disconnect();
        })
        .on('ready', () => {
            // Add the peer to the database.
            const database = connect();
            database('coattail_peers').insert({
                id: peer.id,
                token: peer.token
            }).then(() => {
                console.log('');
                console.log(`Peer added with ID ${c.bold.underline(peer.id)}`);
                console.log(c.italic(`View more information by typing '${c.bold(`coattail peer show --id ${peer.id}`)}'`));
                console.log('');
            }).catch(err => {
                console.error(`${c.red('Error')}: Failed to add peer`);
                console.error(err.stack)
            }).finally(() => {
                client.disconnect();
                database.destroy();
            });
        });
};