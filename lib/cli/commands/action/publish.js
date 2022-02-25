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
        name: 'config',
        alias: 'c',
        description: 'The path to the configuration file to use when publishing the action. Defaults to the config.yml file stored in the root of your Coattail installation.',
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

    if (parameters.help) {
        printHelp(cli);
        return;
    }

    config.load(parameters.config);

    let outputData;
    try {
        outputData = JSON.parse(parameters.data);
    } catch (err) {
        console.log('');
        console.error(` State: ${chalk.hex('#e64e4e')('Error')}`);
        console.log('');
        console.error(` ${chalk.hex('#e64e4e')('Error')}: Invalid data.`);
        console.log('');
        console.error(err);
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

    console.log(` Publishing action data '${parameters.action}' on peer '${peer.id}'...`)
    peer.publishActionResonse({
        name: parameters.action,
        data: outputData
    }).then(() => {
        console.log('');
        console.log(` State:     ${chalk.hex('#6ce64e')('Success!')}`);
        console.log('');
        console.log(` Performed: ${chalk.hex('#e6d74e')('No')}`);
        console.log(` Published: ${chalk.hex('#6ce64e')('Yes')}`);
        console.log('');
    }).catch(err => {
        console.error('');
        console.error(` State: ${chalk.hex('#e64e4e')('Error')}`);
        console.error('');
        console.error(` ${chalk.hex('#e64e4e')('Error')}: Failed to perform action.`);
        console.error('');
        console.error(err);
        console.error('');
    });
};