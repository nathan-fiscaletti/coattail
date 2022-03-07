const templates = require(`../../../templates`);
const path = require(`path`);
const fs = require(`fs`);
const chalk = require(`chalk`);
const commandLineArgs = require('command-line-args');
const config = require(`../../../config`);

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'name',
        alias: 'n',
        description: 'The name for the action.',
        defaultOption: true
    },
    {
        name: 'receiver',
        alias: 'r',
        description: 'Create a receiver instead of an action.',
        type: Boolean
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
        header: 'Coattail -- Create Action',
        content: 'Creates a new action on this Coattail instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail action create [options]`
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

    if(!cli.validateRequired(parameters, ['name'])) {
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    if (!parameters.receiver) {
        const destination = path.join(config.get().paths.actions, `${parameters.name}.js`);

        if (fs.existsSync(destination)) {
            cli.error(`An action with that name already exists.`, `Found in ${chalk.hex('#4e88e6')(destination)}`);
            return;
        }

        try {
            templates.create('action', destination, 'js');
            cli.success(`Action ${parameters.name}.js created! (${chalk.hex('#4e88e6')(destination)})`);
        } catch (err) {
            cli.error(`Failed to create action ${destination}.`, err.stack)
        }
    } else {
        const destination = path.join(config.get().paths.receivers, `${parameters.name}.js`);

        if (fs.existsSync(destination)) {
            cli.error(`A receiver with that name already exists.`, `Found in ${chalk.hex('#4e88e6')(destination)}`);
            return;
        }

        try {
            templates.create('receiver', destination, 'js');
            cli.success(`Receiver ${parameters.name}.js created! (${chalk.hex('#4e88e6')(destination)})`);
        } catch (err) {
            cli.error(`Failed to create receiver ${destination}.`, err.stack)
        }
    }
};