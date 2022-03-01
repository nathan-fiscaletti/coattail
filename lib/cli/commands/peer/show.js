const Peer = require(`../../../peer`);
const commandLineArgs = require('command-line-args');
const chalk = require(`chalk`);
const config = require('../../../config');

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'id',
        description: 'The ID of the peer you wish to view.',
        defaultOption: true
    },
    {
        name: "print-raw-token",
        description: "Prints the raw token for the specified peer to the output",
        type: Boolean
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
        header: 'Coattail -- Show Peer',
        content: 'Shows information for a particular peer registered on this Coattail instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail peer show [options]`
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

    if (parameters.id === undefined) {
        cli.missing('id');
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        console.log('');
        console.error(` State: ${chalk.hex('#e64e4e')('Error')}`);
        console.log('');
        console.error(` ${chalk.hex('#e64e4e')('Error')}: Unable to location coattail instance in location '${parameters.instance || './'}'`);
        console.log('');
        return;
    }

    parameters.printRawToken = parameters['print-raw-token'];
    Peer.load(parameters).then(peer => {
        if (peer === undefined) {
            console.error(`${chalk.hex('#e64e4e')('Error')}: Peer not found. Make sure you're providing the ID for a peer you've registered.`);
            return;
        }

        console.log('');
        console.log(` ${chalk.bold(`Peer ${chalk.underline(peer.id)}`)}`);
        peer.token.print({showId: false});
        if (parameters.printRawToken) {
            console.log(` ${chalk.hex('#6ce64e').underline('Raw Token')}`);
            console.log('');
            console.log(` ${chalk.italic(peer.token.jwt)}`);
            console.log('');
        }
    });
};