const templates = require(`../../../templates`);
const path = require(`path`);
const fs = require(`fs`);
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
        name: 'name',
        alias: 'n',
        description: 'The name for the action.',
        defaultOption: true
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
        printHelp(cli);
        return;
    }

    const destination = path.join(__dirname, '..', '..', '..', '..', 'actions', `${parameters.name}.js`);

    if (fs.existsSync(destination)) {
        console.log('');
        console.error(` ${chalk.hex('#e64e4e')('Error')}: An action with that name already exists.`);
        console.log('');
        return;
    }

    templates.create('action', destination);
    console.log('');
    console.log(` ${chalk.hex('#6ce64e')(`Action ${parameters.name}.js created!`)} (${chalk.hex('#4e88e6')(destination)})`);
    console.log('');
};