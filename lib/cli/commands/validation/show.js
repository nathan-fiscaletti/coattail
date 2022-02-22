const ValidationToken = require(`../../../validation-token`);
const commandLineArgs = require('command-line-args');
const chalk = require(`chalk`);

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'id',
        alias: 'i',
        description: 'The ID of the validation token you wish to view.',
        defaultOption: true
    },
    {
        name: "print-raw-token",
        description: "Prints the raw token to the output",
        type: Boolean
    }
];

const printHelp = cli => cli.printHelp([
    {
        header: 'Coattail -- Show Validation Token',
        content: 'Shows information for a particular validation token loaded into this Coattail instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail validation show [options]`
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

    if(!cli.validateRequired(parameters, ['id'])) {
        printHelp(cli);
        return;
    }

    parameters.printRawToken = parameters['print-raw-token'];

    ValidationToken.load(parameters).then(token => {
        if (token === undefined) {
            console.error(`${chalk.hex('#e64e4e')('Error')}: No validation token found for that ID.`);
            return;
        }

        console.log('');
        console.log(` ${chalk.bold(`Validation Token ${chalk.underline(token.id)}`)}`);
        token.print({showId: false});
        if (parameters.printRawToken) {
            console.log(` ${chalk.hex('#6ce64e').underline('Raw Token')}`);
            console.log('');
            console.log(` ${chalk.italic(token.jwt)}`);
            console.log('');
        }
    });
};