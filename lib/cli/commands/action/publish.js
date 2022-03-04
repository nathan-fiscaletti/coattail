const Peer = require(`../../../peer`);
const commandLineArgs = require('command-line-args');
const config = require(`../../../config`);
const chalk = require(`chalk`);

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
        description: 'The peer you want to publish data to the subscribers of. Defaults to local Coattail instance.'
    },
    {
        name: 'action',
        alias: 'a',
        typeLabel: '{underline name}',
        description: 'The action the data correlates to.'
    },
    {
        name: 'data',
        alias: 'd',
        typeLabel: '{underline file|data}',
        description: 'The data to send to the subscribers.'
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
        header: 'Coattail -- Publish Action',
        content: 'Publishes data to the subscribers of an action.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail action publish [options]`
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

    if (!cli.validateRequired(parameters, ['data', 'action'])) {
        return;
    }

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

    let outputData;
    try {
        outputData = JSON.parse(parameters.data);
    } catch (err) {
        cli.error('Invalid data. Output data must be valid JSON.', err.stack);
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

    cli.waiting(`Publishing action data '${chalk.hex('#6ce64e')(parameters.action)}' on ${peer.isLocal() ? 'instance' : 'peer'} '${chalk.hex('#4e88e6')(peer.id)}'...`)

    peer.publishActionResonse({
        name: parameters.action,
        data: outputData,
        verbose: parameters.verbose
    }).then(() => {
        cli.success(
            `Published action '${chalk.hex('#6ce64e')(parameters.action)}' on ${peer.isLocal() ? 'instance' : 'peer'} '${chalk.hex('#4e88e6')(peer.id)}'.`,
            [
                `Performed: ${chalk.hex('#e6d74e')('No')}`,
                `Published: ${chalk.hex('#6ce64e')('Yes')}`
            ]
        );
    }).catch(err => {
        cli.error('Failed to publish action.', err.stack ?? err);
    });
};