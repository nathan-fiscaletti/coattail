const Token = require(`../../../tokens/token`);
const commandLineArgs = require('command-line-args');
const chalk = require(`chalk`);
const config = require(`../../../config`);

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'id',
        description: 'The ID of the token you wish to view.',
        defaultOption: true
    },
    {
        name: "print-raw-token",
        description: "Prints the raw token to the output",
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
        header: 'Coattail -- Show Token',
        content: 'Shows information for a particular token issued by this Coattail instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail token show [options]`
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

    if (!cli.validateRequired(parameters, ['id'])) {
        printHelp(cli);
        return;
    }

    parameters.printRawToken = parameters['print-raw-token'];

    try {
        config.load(parameters.instance);
    } catch (_) {
        console.log('');
        console.error(` State: ${chalk.hex('#e64e4e')('Error')}`);
        console.log('');
        console.error(` ${chalk.hex('#e64e4e')('Error')}: Unable to location coattail instance in location '${parameters.instance || './'}'`);
        console.log('');
        return;
    }

    Token.load(parameters).then(token => {
        if (token === undefined) {
            console.error(`${chalk.hex('#e64e4e')('Error')}: No token found for that ID.`);
            return;
        }

        console.log('');
        console.log(` ${chalk.bold(`Token ${chalk.underline(token.id)}`)}`);
        token.print({showId: false});
        if (parameters.printRawToken) {
            console.log(` ${chalk.hex('#6ce64e').underline('Raw Token')}`);
            console.log('');
            console.log(` ${chalk.italic(token.jwt)}`);
            console.log('');
        }
    });
};