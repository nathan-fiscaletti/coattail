const Peer = require(`../../../peer`);
const chalk = require(`chalk`);
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
        name: 'id',
        description: 'The ID of the peer you wish to remove.',
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
        header: 'Coattail -- Remove Peer',
        content: 'Remove a registered peer from this Coattail instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail peer remove [options]`
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

    if(!cli.validateRequired(parameters, ['id'])) {
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    const peer = await Peer.load({id: parameters.id});
    if (peer === undefined) {
        cli.error(`Peer not found.`, `Make sure you're providing the ID for a peer you've registered.`);
        return;
    }

    peer.delete()
        .then(() => {
            cli.success(`Removed peer ${parameters.id}`);
        })
        .catch(err => {
            cli.error(`Failed to remove peer ${parameters.id}`, err.stack || `${err}`);
        });
};