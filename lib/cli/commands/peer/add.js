const Peer = require(`../../../peer`);
const Token = require(`../../../token`);
const Client = require(`../../../client`);
const chalk = require(`chalk`);
const log = require(`../../../log`);

const commandLineArgs = require('command-line-args');

module.exports = async (cli) => {
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
    const peer = new Peer({jwt: options.token});
    if (!peer.token.isValid()) {
        console.error(`${chalk.hex('#e64e4e')('Error')}: Invalid token.`);
        return;
    }

    // const config = require(`../../../server/config`).load();
    // if (peer.token.getIssuer() == Token.getTokenIssuer(config)) {
    //     console.error(`${chalk.hex('#e64e4e')('Error')}: Cannot add peers using tokens issued by this instance.`);
    //     console.error(`       See docs/token_issuance.md for more information.`);
    //     return;
    // }

    // Verify that we can connect to the peer, and that we are able to properly
    // authenticate with it.
    const client = Client.connect(peer, log('').silent());
    client
        .on('error', (err) => {
            const clientConfig = peer.token.getClientConfig();
            console.error(`${chalk.hex('#e64e4e')('Error')}: Unable to add peer. Failed to connect to peer ${chalk.bold(`${clientConfig.tls ? 'TLS ' : ''}${clientConfig.host}:${clientConfig.port}`)}`);
            console.error(`${chalk.hex('#e64e4e')('Error')}: Verify that the peer associated with the token you're attempting to use is currently running.`);
            console.error(`${chalk.hex('#e64e4e')('Error')}: ${err}`);
            client.disconnect();
        })
        .on('auth-failed', () => {
            console.error(`${chalk.hex('#e64e4e')('Error')}: Unable to add peer. Token does not contain a valid signature.`);
            console.error(`${chalk.hex('#e64e4e')('Error')}: Verify that the token you are attempting to use has not been tampered with and is not expired.`);
            client.disconnect();
        })
        .on('ready', async () => {
            client.disconnect();
            try {
                await peer.save();
                console.log('');
                console.log(`Peer added with ID ${chalk.bold.underline(peer.id)}`);
                console.log(chalk.italic(`View more information by typing '${chalk.bold(`coattail peer show --id ${peer.id}`)}'`));
                console.log('');
            } catch (err) {
                console.error(`${chalk.hex('#e64e4e')('Error')}: Failed to add peer`);
                console.error(err.stack)
            }
        });
};