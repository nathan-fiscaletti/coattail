const Peer = require(`../../../peer`);
const Client = require(`../../../client`);
const Token = require(`../../../tokens/token`);
const chalk = require(`chalk`);
const log = require(`../../../log`);
const commandLineArgs = require('command-line-args');
const config = require('../../../config');

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'token',
        alias: 't',
        description: 'The JWT token issued by the peer.',
        defaultOption: true
    },
    {
        name: 'instance',
        alias: 'i',
        description: 'The path to the local Coattail Instance.',
        typeLabel: '{underline path}'
    }
];

const printHelp = cli => cli.printHelp([
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
        optionList: options
    }
]);

module.exports = async cli => {
    const parameters = commandLineArgs(options, {
        argv: cli.argv,
        stopAtFirstUnknown: true
    });

    if (parameters.help) {
        printHelp(cli);
        return;
    }

    if (!cli.validateRequired(parameters, ['token'])) {
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    cli.waiting(`Verifying peer token...`);

    // Verify that the token was not issued by this coattail instance.
    const peer = new Peer({jwt: parameters.token});
    if (!peer.token.isValid()) {
        cli.error(`Failed to add peer.`, `Invalid peer token.`);
        return;
    }

    // Verify that this token wasn't issued by this peer.
    if (peer.token.issuer() == Token.getTokenIssuer()) {
        cli.error(`Failed to add peer.`, `Cannot add peers using tokens issued by this instance.`);
        return;
    }

    // Verify that we can connect to the Coattail instance that issued the token.
    const client = Client.connect(peer, log('').silent());
    client
        .on('error', (err) => {
            const clientConfig = peer.token.getClientConfig();
            cli.error(`Failed to add peer.`, [
                `Failed to establish a connection to ${chalk.hex('#4e88e6')(`${chalk.bold(`${clientConfig.tls ? 'TLS ' : ''}${clientConfig.host}:${clientConfig.port}`)}`)}`,
                '',
                `Verify that the peer associated with the token you're attempting to use is currently running.`,
                '',
                ...(err.stack || `${err}`).split(/\r?\n/)
            ]);
            client.disconnect();
        })
        .on('auth-failed', () => {
            cli.error(`Failed to add peer.`, [
                'Token does not contain a valid signature.',
                '',
                'Verify that the token you are attempting to use has not been tampered with and is not expired.'
            ]);
            client.disconnect();
        })
        .on('ready', async () => {
            client.disconnect();
            try {
                // Save the token.
                await peer.save();

                let lines;
                peer.token.print({showId: false, outputHandler: l => lines = l});

                cli.success(
                    `Peer added with ID '${chalk.bold.underline(peer.id)}'`,
                    [
                        ...lines.slice(0, lines.length - 1).map(l => l.slice(1))
                    ]
                );
            } catch (err) {
                cli.error(`Failed to add peer.`, err.stack || `${err}`);
            }
        });
};