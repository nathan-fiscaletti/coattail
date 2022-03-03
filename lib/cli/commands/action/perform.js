const chalk = require(`chalk`);
const commandLineArgs = require('command-line-args');
const config = require('../../../config');
const Peer = require(`../../../peer`);
require('node-json-color-stringify');

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'peer',
        typeLabel: '{underline id}',
        description: 'The peer you want to perform an action on. Defaults to local instance.'
    },
    {
        name: 'action',
        alias: 'a',
        typeLabel: '{underline name}',
        description: 'The action to perform.'
    },
    {
        name: 'data',
        alias: 'd',
        typeLabel: '{underline file|data}',
        description: 'The data to send to the action.'
    },
    {
        name: 'publish-results',
        alias: 'n',
        type: Boolean,
        description: `Whether or not to publish the results of the action to it's subscribers`
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

const printHelp = (cli) => cli.printHelp([
    {
        header: 'Coattail -- Perform Action',
        content: 'Performs an action on an instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail action perform [options]`
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

    if (!cli.validateRequired(parameters, ['data', 'action'])) {
        return;
    }

    parameters.publishResults = parameters['publish-results'];

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    let inputData;
    try {
        inputData = JSON.parse(parameters.data);
    } catch (err) {
        cli.error('Invalid input data. Input data must be valid JSON.', err.stack);
        return;
    }

    let peer = Peer.local();
    if (parameters.peer) {
        peer = await Peer.load({id: parameters.peer});
        if (peer === undefined) {
            cli.error(`Peer not found. Make sure you're providing the ID for a peer you've registered.`);
            return;
        }
    }

    cli.waiting(`Performing action '${chalk.hex('#6ce64e')(parameters.action)}' on ${peer.isLocal() ? 'instance' : 'peer'} '${chalk.hex('#4e88e6')(peer.id)}'...`);

    peer.performAction({
        name: parameters.action,
        data: inputData,
        publish: !!parameters.publishResults,
        verbose: parameters.verbose
    }).then(res => {
        const resLines = JSON.colorStringify(res, null, 2).split(/\r?\n/);

        cli.success(
            `Performed action '${chalk.hex('#6ce64e')(parameters.action)}' on ${peer.isLocal() ? 'instance' : 'peer'} '${chalk.hex('#4e88e6')(peer.id)}'.`,
            [
                `Performed: ${chalk.hex('#6ce64e')('Yes')}`,
                `Published: ${parameters.publishResults ? chalk.hex('#6ce64e')('Yes') : chalk.hex('#e6d74e')('No')}`,
                ``,
                `Output:`,
                '',
                ...resLines
            ]
        );
    }).catch(err => {
        cli.error('Failed to perform action.', err.stack ?? err);
    });
};