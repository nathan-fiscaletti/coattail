const ValidationToken = require(`../../../validation-token`);
const commandLineArgs = require('command-line-args');
const clipboardy = require(`clipboardy`);
const chalk = require(`chalk`);

module.exports = async (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean },
        { name: "not-before", alias: 'n' },
        { name: "expires-in", alias: 'e' },
        { name: "quiet", alias: 'q', type: Boolean },
        { name: "print-raw-token", alias: 'r', type: Boolean }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
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
                optionList: [
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
                    }
                ]
            }
        ]);
        return;
    }

    options.notBefore = options['not-before'];
    options.expiresIn = options['expires-in'];
    options.printRawToken = options['print-raw-token'];

    let notBefore = options.notBefore;
    let expiresIn = options.expiresIn;

    const config = require(`../../../server/config`).load();
    let token;
    try {
        token = await ValidationToken.issue(config, {notBefore, expiresIn});
    } catch (err) {
        console.error(`${chalk.hex('#e64e4e')('Error')}: Failed to issue new token.`);
        console.error(`${chalk.hex('#e64e4e')('Error')}: ${err}`);
        console.error(err);
        return;
    }

    if (options.quiet) {
        if (options.printRawToken) {
            console.log(token.jwt);
        } else {
            clipboardy.writeSync(token.jwt);
        }
        return;
    }

    console.log('');
    console.log(` ${chalk.bold(`New Validation Token Generated!`)}`);
    token.print({showId: false});
    if (options.printRawToken) {
        console.log(` ${chalk.hex('#6ce64e').underline('Raw Token')}`);
        console.log('');
        console.log(` ${chalk.italic(token.jwt)}`);
    } else {
        clipboardy.writeSync(token.jwt);
        console.log(` ${chalk.hex('#6ce64e').underline('Raw token copied to clipboard!')}`);
    }
    console.log('');
};