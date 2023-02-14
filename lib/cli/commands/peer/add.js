const package = require('../../../../package.json');
const fs = require('fs');
const path = require('path');
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

    try {
        const v = fs.readFileSync(path.join(parameters.instance || process.cwd(), '.ct.version'), 'utf8');
        if (v !== package.version) {
            cli.error(`This instance is using Coattail v${v}, but the CLI is v${package.version}.`, `Please install version ${v} of the Coattail CLI to manage this instance.`);
            return;
        }
    } catch (_) {
        cli.error(`Unable to locate '.ct.version' in '${parameters.instance || process.cwd()}'.`);
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

    const conflictingPeers = await Peer.loadAllMatching({matches: other => {
        return other.token.issuer() === peer.token.issuer()
    }});

    const [ conflictingPeer ] = conflictingPeers;

    if (conflictingPeer !== undefined) {
        cli.error(
            'A peer already exists issued by the issuer corresponding to the token you are attempting to load.',
            [
                'Please remove the offending peer before adding this token.',
                '',
                `Offending Peer ID:      ${chalk.hex('#e64e4e')(conflictingPeer.id)}`,
                `Offending Issuer Hash:  ${chalk.hex('#e6d74e')(conflictingPeer.token.issuer())}`
            ]
        );
        return;
    }

    // Verify that we can connect to the Coattail instance that issued the token.
    const client = Client.connect(peer, 5000, log('').silent());
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

                const extraLines = [];
                if (!peer.token.claims().tls) {
                    extraLines.push('');
                    extraLines.push(`${chalk.hex('#e64e4e')(`Warning`)}: ${chalk.hex('#e6d74e')(`The peer you've added does not use TLS for it's connections.`)}`);
                    extraLines.push(chalk.hex('#e6d74e')(`         Data exchanged with the peer will not be encrypted.`));
                    extraLines.push(chalk.hex('#e6d74e')(`         Proceed with caution.`));
                }

                cli.success(
                    `Peer added with ID '${chalk.bold.underline(peer.id)}'`,
                    [
                        ...lines.slice(0, lines.length - 1).map(l => l.slice(1)),
                        ...extraLines
                    ]
                );
            } catch (err) {
                cli.error(`Failed to add peer.`, err.stack || `${err}`);
            }
        });
};