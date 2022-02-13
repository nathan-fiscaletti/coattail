const Peer = require(`../../../peer`);
const { connect } = require(`../../../data/connection`);
const c = require('ansi-colors');

const commandLineArgs = require('command-line-args');

const printHelp = (cli) => {
    cli.printHelp([
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
            optionList: [
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
            ]
        }
    ]);
};

module.exports = async (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean},
        { name: 'peer', alias: 'p' },
        { name: 'action', alias: 'a' },
        { name: 'data', alias: 'd' },
        { name: 'publish-results', alias: 'n', type: Boolean }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        printHelp(cli);
        return;
    }

    if (!cli.validateRequired(options, ['data', 'action'])) {
        printHelp(cli);
        return;
    }

    options.publishResults = options['publish-results'];

    let inputData;
    try {
        inputData = JSON.parse(options.data);
    } catch (err) {
        console.error(`${c.red('Error')}: Invalid input data.`);
        console.error(err);
        return;
    }

    const peer = Peer.local();
    if (options.peer) {
        const connection = connect();
        peer = await Peer.load(connection, options.peer)
    }

    console.log(`Performing action '${options.action}' on peer '${peer.id}'...`)
    peer.performAction(options.action, inputData, options.publishResults).then(res => {
        console.log('');
        console.log(`State:     ${c.green('Success!')}`);
        console.log(`Performed: ${c.green('Yes')}`);
        console.log(`Published: ${options.publishResults ? c.green('Yes') : c.yellow('No') }`);
        console.log('');
        process.stdout.write('Output:    ');
        console.log(res);
    }).catch(err => {
        console.error(`State: ${c.red('Error')}`);
        console.error('');
        console.error(`${c.red('Error')}: Failed to perform action.`);
        console.error('');sss
        console.error(err);
        return;
    });
};