const ValidationToken = require(`../../../tokens/validation-token`);
const commandLineArgs = require('command-line-args');
const chalk = require(`chalk`);
const config = require('../../../config');

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'token',
        alias: 't',
        description: 'The validation token.',
        defaultOption: true
    },
    {
        name: 'config',
        alias: 'c',
        description: 'The path to the configuration file to use when storing Tokens. Defaults to the config.yml file stored in the root of your Coattail installation.',
        typeLabel: '{underline path}'
    }
];

const printHelp = cli => cli.printHelp([
    {
        header: 'Coattail -- Add Signature Validation Token',
        content: 'Adds a new validation token to this Coattail instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail validation add [options]`
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

    if(!cli.validateRequired(parameters, ['token'])) {
        printHelp(cli);
        return;
    }

    config.load(parameters.config);

    let vt;
    try {
        vt = new ValidationToken({jwt: parameters.token});
        await vt.save();
        console.log('');
        console.log(`Validation token added with ID ${chalk.bold.underline(vt.id)}`);
        console.log(chalk.italic(`View more information by typing '${chalk.bold(`coattail validation show --id ${vt.id}`)}'`));
        console.log('');
    } catch (err) {
        console.error(`${chalk.hex('#e64e4e')('Error')}: Failed to add validation token`);
        console.error(err.stack)
    }
};