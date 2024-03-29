const package = require('../../../../package.json');
const fs = require('fs');
const path = require('path');
const chalk = require(`chalk`);
const commandLineArgs = require('command-line-args');
const config = require('../../../config');
const Peer = require(`../../../peer`);
const log = require(`../../../log`);
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
        alis: 'p',
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
        name: 'notify',
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

const printHelp = cli => cli.printHelp([
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

    try {
        const v = fs.readFileSync(path.join(parameters.instance || process.cwd(), '.ct.version'), 'utf8');
        if (v !== package.version) {
            cli.error(`This instance is using Coattail v${v}, but the CLI is v${package.version}.`, `Please install version ${v} of the Coattail CLI to manage this instance.`);
            return;
        }
    } catch (_) {
        cli.error(`This command must be run from the root directory of a Coattail instance.`);
        return;
    }

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
            cli.error(`Peer not found.`, [
                `Make sure you're providing the ID for a peer you've registered.`,
                ''
                `See ${chalk.hex('#4e88e6')(`coattail peer list`)} for a list of available Peers.`
            ]);
            return;
        }
    }

    cli.waiting(`Performing action '${chalk.hex('#6ce64e')(parameters.action)}' on ${peer.isLocal() ? 'instance' : 'peer'} '${chalk.hex('#4e88e6')(peer.id)}'...`);

    const bufferedLogger = log(`cli`).buffered();
    peer.performAction({
        name: parameters.action,
        data: inputData,
        publish: !!parameters.notify,
        verbose: parameters.verbose,
        logger: bufferedLogger
    }).then(res => {
        const resLines = JSON.colorStringify(res, null, 2).split(/\r?\n/);

        let logLines = [];
        if (bufferedLogger.buffer && bufferedLogger.buffer.lines.length > 0) {
            logLines.push('');
            logLines.push(chalk.bold('Log Messages:'));
            logLines.push('');
            for(const line of bufferedLogger.buffer.lines) {
                logLines.push(chalk.italic(line));
            }
        }

        cli.success(
            `Performed action '${chalk.hex('#6ce64e')(parameters.action)}' on ${peer.isLocal() ? 'instance' : 'peer'} '${chalk.hex('#4e88e6')(peer.id)}'.`,
            [
                `Performed: ${chalk.hex('#6ce64e')('Yes')}`,
                `Published: ${parameters.notify ? chalk.hex('#6ce64e')('Yes') : chalk.hex('#e6d74e')('No')}`,
                ``,
                chalk.bold(`Output:`),
                '',
                ...resLines,
                ...logLines
            ]
        );
    }).catch(err => {
        cli.error('Failed to perform action.', err.stack || err);
    });
};