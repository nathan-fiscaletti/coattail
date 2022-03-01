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

    if(!cli.validateRequired(parameters, ['id'])) {
        printHelp(cli);
        return;
    }

    if (parameters.help) {
        printHelp(cli);
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

    const peer = await Peer.load({id: parameters.id});
    if (peer === undefined) {
        console.error(`${chalk.hex('#e64e4e')('Error')}: Peer not found. Make sure you're providing the ID for a peer you've registered.`);
        return;
    }

    peer.delete()
        .then(() => {
            console.log(`${chalk.hex('#6ce64e')(`Removed peer ${parameters.id}`)}`);
        })
        .catch(err => {
            console.error(`${chalk.hex('#e64e4e')('Error')}: Failed to remove peer ${parameters.id}`);
            console.error(err);
        });
};