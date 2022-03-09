const Peer = require(`../../../peer`);
const config = require(`../../../config`);
const chalk = require(`chalk`);
const { table, getBorderCharacters  } = require(`table`);
const commandLineArgs = require('command-line-args');

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
        description: 'The peer you want to list actions for. Defaults to local Coattail instance.'
    },
    {
        name: 'receivers',
        alias: 'r',
        description: 'Look at receivers instead of actions',
        type: Boolean
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
        header: 'Coattail -- List Actions',
        content: 'Lists actions on an instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail action list [options]`
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

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    let peer = Peer.local();
    if (parameters.peer) {
        peer = await Peer.load({id: parameters.peer});
        if (peer === undefined) {
            cli.error(`Peer not found.`, [
                `Make sure you're providing the ID for a peer you've registered.`,
                ''
                `See ${chalk.hex('#4e88e6')(`coattail peer list`)} for a list of available Peers.`
            ]);
            return;
        }
    }

    if (!parameters.receivers) {
        cli.waiting(`Loading actions for ${peer.isLocal() ? 'instance' : 'peer'} '${chalk.hex('#4e88e6')(peer.id)}'...`);

        peer.getActions(parameters).then(actions => {
            const data = [[
                chalk.hex('#4e88e6')(`Action`),
                chalk.hex('#4e88e6')(`Can Publish`),
                chalk.hex('#4e88e6')(`Can Perform`),
                chalk.hex('#4e88e6')(`Can Subscribe`)
            ]];
            for (const action of actions) {
                data.push([
                    chalk.bold(action.name),
                    action.publishable ? chalk.hex('#6ce64e')(`Yes`) : chalk.hex('#e6d74e')(`No`),
                    action.performable ? chalk.hex('#6ce64e')(`Yes`) : chalk.hex('#e6d74e')(`No`),
                    action.subscribable ? chalk.hex('#6ce64e')(`Yes`) : chalk.hex('#e6d74e')(`No`)
                ]);
            }

            const output = table(data, {
                border: getBorderCharacters('void'),
                columnDefault: {
                    paddingLeft: 1,
                    paddingRight: 1
                },
                drawHorizontalLine: () => false
            });
            const outputLines = output.split(/\r?\n/);

            cli.success(
                `Loaded actions for ${peer.isLocal() ? 'instance' : 'peer'} '${chalk.hex('#4e88e6')(peer.id)}'.`,
                [
                    chalk.hex('#6ce64e')('Available Actions'),
                    '',
                    ...outputLines.slice(0, outputLines.length - 1).map(l => l.slice(1))
                ]
            );
        }).catch(err => {
            cli.error('Failed to list actions.', err.stack || `${err}`);
        });
    } else {
        cli.waiting(`Loading receivers for ${peer.isLocal() ? 'instance' : 'peer'} '${chalk.hex('#4e88e6')(peer.id)}'...`);

        peer.getReceivers().then(receivers => {
            const data = [[
                chalk.hex('#4e88e6')(`Name`)
            ]];
            for (const receiver of receivers) {
                data.push([
                    chalk.bold(receiver.name)
                ]);
            }

            const output = table(data, {
                border: getBorderCharacters('void'),
                columnDefault: {
                    paddingLeft: 1,
                    paddingRight: 1
                },
                drawHorizontalLine: () => false
            });
            const outputLines = output.split(/\r?\n/);

            cli.success(
                `Loaded receivers for ${peer.isLocal() ? 'instance' : 'peer'} '${chalk.hex('#4e88e6')(peer.id)}'.`,
                [
                    chalk.hex('#6ce64e')('Available Receivers'),
                    '',
                    ...outputLines.slice(0, outputLines.length - 1).map(l => l.slice(1))
                ]
            );
        }).catch(err => {
            cli.error('Failed to list receivers.', err.stack || err);
        });
    }
};