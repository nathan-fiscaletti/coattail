const Peer = require(`../../../peer`);
const chalk = require(`chalk`);
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

    let inputData;
    try {
        inputData = JSON.parse(parameters.data);
    } catch (err) {
        console.error(`${chalk.hex('#e64e4e')('Error')}: Invalid input data.`);
        console.error(err);
        return;
    }

    let peer = Peer.local();
    if (parameters.peer) {
        peer = await Peer.load({id: parameters.peer});
        if (peer === undefined) {
            console.error(`${chalk.hex('#e64e4e')('Error')}: Peer not found. Make sure you're providing the ID for a peer you've registered.`);
            return;
        }
    }

    console.log(`Performing action '${parameters.action}' on peer '${peer.id}'...`)
    peer.performAction({
        name: parameters.action,
        data: inputData,
        publish: !!parameters.publishResults
    }).then(res => {
        console.log('');
        console.log(`State:     ${chalk.hex('#6ce64e')('Success!')}`);
        console.log(`Performed: ${chalk.hex('#6ce64e')('Yes')}`);
        console.log(`Published: ${parameters.publishResults ? chalk.hex('#6ce64e')('Yes') : chalk.hex('#e6d74e')('No') }`);
        console.log('');
        process.stdout.write('Output:    ');
        console.log(res);
    }).catch(err => {
        console.error(`State: ${chalk.hex('#e64e4e')('Error')}`);
        console.error('');
        console.error(`${chalk.hex('#e64e4e')('Error')}: Failed to perform action.`);
        console.error('');
        console.error(err);
        return;
    });
};