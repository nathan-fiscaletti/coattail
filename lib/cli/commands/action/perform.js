const chalk = require(`chalk`);
const commandLineArgs = require('command-line-args');
const config = require('../../../config');
const Peer = require(`../../../peer`);

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
        name: 'config',
        alias: 'c',
        description: 'The path to the configuration file to use when performing the action. Defaults to the config.yml file stored in the root of your Coattail installation.',
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
        printHelp(cli);
        return;
    }

    parameters.publishResults = parameters['publish-results'];

    config.load(parameters.config);

    let inputData;
    try {
        inputData = JSON.parse(parameters.data);
    } catch (err) {
        console.log('');
        console.error(` State: ${chalk.hex('#e64e4e')('Error')}`);
        console.log('');
        console.error(` ${chalk.hex('#e64e4e')('Error')}: Invalid input data.`);
        console.error(err);
        console.log('');
        return;
    }

    let peer = Peer.local();
    if (parameters.peer) {
        peer = await Peer.load({id: parameters.peer});
        if (peer === undefined) {
            console.log('');
            console.error(` State: ${chalk.hex('#e64e4e')('Error')}`);
            console.log('');
            console.error(` ${chalk.hex('#e64e4e')('Error')}: Peer not found. Make sure you're providing the ID for a peer you've registered.`);
            console.log('');
            return;
        }
    }

    console.log('');
    console.log(` Performing action '${parameters.action}' on peer '${peer.id}'...`)
    console.log('');
    peer.performAction({
        name: parameters.action,
        data: inputData,
        publish: !!parameters.publishResults,
        verbose: parameters.verbose
    }).then(res => {
        console.log(` State:     ${chalk.hex('#6ce64e')('Success!')}`);
        console.log('');
        console.log(` Performed: ${chalk.hex('#6ce64e')('Yes')}`);
        console.log(` Published: ${parameters.publishResults ? chalk.hex('#6ce64e')('Yes') : chalk.hex('#e6d74e')('No') }`);
        console.log('');
        process.stdout.write(' Output:    ');
        console.log(res);
        console.log('');
    }).catch(err => {
        console.error(` State: ${chalk.hex('#e64e4e')('Error')}`);
        console.error('');
        console.error(` ${chalk.hex('#e64e4e')('Error')}: Failed to perform action.`);
        console.error('');
        console.error(err);
    });
};