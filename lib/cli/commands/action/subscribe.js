const Peer = require(`../../../peer`);
const chalk = require(`chalk`);
const commandLineArgs = require('command-line-args');
const config = require('../../../config');
const ReceiverManager = require('../../../receiver-manager');
const { isMatch } = require(`lodash`);

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
        description: 'The receiver that should handle incoming publications from the publisher.'
    },
    {
        name: 'verbose',
        alias: 'v',
        type: Boolean,
        description: `Display verbose output.`
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
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    const peer = await Peer.load({id: parameters.peer});
    if (peer === undefined) {
        cli.error(`Peer not found. Make sure you're providing the ID for a peer you've registered.`);
        return;
    }

    let receiver;
    const rm = new ReceiverManager();
    try {
        receiver = await rm.load(parameters.receiver);
    } catch (err) {
        cli.error(`No receiver found with name '${parameters.receiver}'.`, err.stack || `${err}`);
        return;
    }

    peer.getActions().then(actions => {
        if (!actions.some(a => a.name === parameters.action)) {
            cli.error(`No action with name '${chalk.hex('#6ce64e')(parameters.action)}' found on peer '${chalk.hex('#4e88e6')(peer.id)}'.`);
        } else {
            cli.waiting(`Subscribing to action '${chalk.hex('#6ce64e')(parameters.action)}' on peer '${chalk.hex('#4e88e6')(peer.id)}'...`);

            peer.subscribeTo(parameters).then(token => {
                let lines = [];
                token.print({showId: true, outputHandler: _lines => lines = _lines});
                cli.success(
                    `Subscribed to action '${chalk.hex('#6ce64e')(parameters.action)}' on peer '${chalk.hex('#4e88e6')(peer.id)}'.`,
                    [
                        chalk.hex('#6ce64e')('Token Information'),
                        '',
                        ...lines.slice(0, lines.length - 1).map(l => l.slice(1))
                    ]
                );
            }).catch(error => {
                cli.error(`Failed to subscribe to peer.`, error.stack || `${error}`);
            });
        }
    }).catch(err => {
        cli.error('Failed to validate action on Peer', err.stack || `${err}`);
    });
};