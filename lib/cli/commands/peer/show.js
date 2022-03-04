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

    if (!cli.validateRequired(parameters, ['id'])) {
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    parameters.printRawToken = parameters['print-raw-token'];

    const peer = await Peer.load({id: parameters.id});
    if (peer === undefined) {
        cli.error(`Peer not found.`, `Make sure you're providing the ID for a peer you've registered.`);
        return;
    }

    let lines;
    peer.token.print({showId: false, outputHandler: l => lines = l});

    cli.success(
        `Peer '${chalk.bold.underline(peer.id)}'`,
        [
            ...lines.slice(0, lines.length - 1).map(l => l.slice(1))
        ]
    );

    if (parameters.printRawToken) {
        cli.raw(`${chalk.hex('#6ce64e').underline('Raw Token')}: ${chalk.italic(peer.token.jwt)}`);
    }
};