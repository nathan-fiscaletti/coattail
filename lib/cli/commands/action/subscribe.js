const Peer = require(`../../../peer`);
const chalk = require(`chalk`);
const commandLineArgs = require('command-line-args');
const config = require('../../../config');
const ActionManager = require(`../../../action-manager`);

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'peer',
        alias: 'p',
        typeLabel: '{underline id}',
        description: 'The peer that the action you are subscribing to is published from.'
    },
    {
        name: 'action',
        alias: 'a',
        typeLabel: '{underline name}',
        description: 'The action that you want to subscribe to.'
    },
    {
        name: 'receiver',
        alias: 'r',
        typeLabel: '{underline name}',
        description: 'The action that should handle incoming publications from the publisher.'
    },
    {
        name: 'config',
        alias: 'c',
        description: 'The path to the configuration file to use when subscribing to the action. Defaults to the config.yml file stored in the root of your Coattail installation.',
        typeLabel: '{underline path}'
    }
];

const printHelp = cli => cli.printHelp([
    {
        header: 'Coattail -- Subscribe to Action',
        content: 'Subscribes to an action on an instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail action subscribe [options]`
        ]
    },
    {
        header: 'Options',
        optionList: options
    }
]);

module.exports = async cli => {
    const parameters = commandLineArgs(options, {
        argv: cli.argv, stopAtFirstUnknown: true
    });

    if (parameters.help) {
        printHelp(cli);
        return;
    }

    if (!cli.validateRequired(parameters, ['peer', 'action', 'receiver'])) {
        printHelp(cli);
        return;
    }

    config.load(parameters.config);

    const peer = await Peer.load({id: parameters.peer});
    if (peer === undefined) {
        console.error(`${chalk.hex('#e64e4e')('Error')}: Peer not found. Make sure you're providing the ID for a peer you've registered.`);
        return;
    }

    const am = new ActionManager();
    try {
        await am.load(parameters.receiver);
    } catch (err) {
        console.error(`${chalk.hex('#e64e4e')('Error')}: No action found with name '${parameters.receiver}'. Please provide a valida action for the receiver.`);
        return;
    }

    peer.subscribeTo(parameters.receiver, parameters.action)
        .then(({token, peerId}) => {
            console.log('');
            console.log(` ${chalk.hex('#6ce64e')('Success')}: Subscribed to action '${chalk.hex('#4e88e6')(parameters.action)}' on peer '${chalk.hex('#4e88e6')(parameters.peer)}'.`);
            token.print({showId: true, extras: {"Peer Token ID": peerId}});
        })
        .catch(error => {
            console.error(`${chalk.hex('#e64e4e')('Error')}: Failed to subscribe to peer: ${error}`);
        });
};