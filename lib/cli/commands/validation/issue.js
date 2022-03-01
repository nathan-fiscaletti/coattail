const ValidationToken = require(`../../../tokens/validation-token`);
const commandLineArgs = require('command-line-args');
const clipboardy = require(`clipboardy`);
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
        name: "not-before",
        alias: 'n',
        typeLabel: '{underline duration}',
        description: 'A number of seconds or string representing a timespan eg: "1d", "20h", 60. This indicates the time at which this token becomes usable. Defaults to immediately.'
    },
    {
        name: "expires-in",
        alias: 'e',
        typeLabel: '{underline duration}',
        description: 'A number of seconds or string representing a timespan eg: "1d", "20h", 60. This indicates the time at which this token expires. Defaults to never.'
    },
    {
        name: "quiet",
        alias: 'q',
        description: "Suppresses all output. If --print-raw-token is passed, the token will still be printed.",
        type: Boolean
    },
    {
        name: "print-raw-token",
        alias: 'r',
        description: "Prints the raw token to the output instead of copying it to the clipboard.",
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
        header: 'Coattail -- Issue Validation Token',
        content: 'Issues a new validation token.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail validation issue [options]`
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

    parameters.notBefore = parameters['not-before'];
    parameters.expiresIn = parameters['expires-in'];
    parameters.printRawToken = parameters['print-raw-token'];

    let notBefore = parameters.notBefore;
    let expiresIn = parameters.expiresIn;

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

    let token;
    try {
        token = await ValidationToken.issue({notBefore, expiresIn});
    } catch (err) {
        console.error(`${chalk.hex('#e64e4e')('Error')}: Failed to issue new token.`);
        console.error(`${chalk.hex('#e64e4e')('Error')}: ${err.stack}`);
        console.error(err);
        return;
    }

    if (parameters.quiet) {
        if (parameters.printRawToken) {
            console.log(token.jwt);
        } else {
            clipboardy.writeSync(token.jwt);
        }
        return;
    }

    console.log('');
    console.log(` ${chalk.bold(`New Validation Token Generated!`)}`);
    token.print({showId: false});
    if (parameters.printRawToken) {
        console.log(` ${chalk.hex('#6ce64e').underline('Raw Token')}`);
        console.log('');
        console.log(` ${chalk.italic(token.jwt)}`);
    } else {
        clipboardy.writeSync(token.jwt);
        console.log(` ${chalk.hex('#6ce64e').underline('Raw token copied to clipboard!')}`);
    }
    console.log('');
};