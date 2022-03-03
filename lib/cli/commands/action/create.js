const templates = require(`../../../templates`);
const path = require(`path`);
const paths = require(`../../../paths`);
const fs = require(`fs`);
const chalk = require(`chalk`);
const commandLineArgs = require('command-line-args');
const config = require(`../../../config`);
const os = require(`os`);

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

    const destination = path.join(config.get().paths.actions, `${parameters.name}.js`);

    if (fs.existsSync(destination)) {
        cli.error(`An action with that name already exists.`, `Found in ${chalk.hex('#4e88e6')(destination)}`);
        return;
    }

    try {
        templates.create('action', destination, 'js', {
            '{ACTION_PATH}': path.relative(config.get().paths.actions, `${paths.LIB}${path.sep}action`)
        });
        cli.success(`Action ${parameters.name}.js created! (${chalk.hex('#4e88e6')(destination)})`);
    } catch (err) {
        cli.error(`Failed to create action ${destination}.`, err.stack)
    }
};