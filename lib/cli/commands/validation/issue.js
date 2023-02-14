const package = require('../../../../package.json');
const fs = require('fs');
const path = require('path');
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

    try {
        const v = fs.readFileSync(path.join(parameters.instance || process.cwd(), '.ct.version'), 'utf8');
        if (v !== package.version) {
            cli.error(`This instance is using Coattail v${v}, but the CLI is v${package.version}.`, `Please install version ${v} of the Coattail CLI to manage this instance.`);
            return;
        }
    } catch (_) {
        cli.error(`Unable to locate '.ct.version' in '${parameters.instance || process.cwd()}'.`);
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
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    let token;
    try {
        token = await ValidationToken.issue({notBefore, expiresIn});
    } catch (err) {
        cli.error(`Failed to issue new Validation Token.`, err.stack || `${err}`);
        return;
    }

    if (parameters.quiet) {
        if (parameters.printRawToken) {
            process.env.COATTAIL_OUTPUT = 'plain';
            cli.success(token.jwt);
        } else {
            clipboardy.writeSync(token.jwt);
        }
        return;
    }
    let lines;
    token.print({showId: false, outputHandler: l => lines = l});

    const extraLines = [];
    if(!parameters.printRawToken) {
        clipboardy.writeSync(token.jwt);
        extraLines.push('');
        extraLines.push(chalk.hex('#6ce64e').underline('Raw token copied to clipboard!'));
    }

    cli.success(`New Validation Token Generated!`, [
        ...lines.slice(0, lines.length - 1).map(l => l.slice(1)),
        ...extraLines
    ]);

    if (parameters.printRawToken) {
        cli.raw(`${chalk.hex('#6ce64e').underline('Raw Token')}: ${chalk.italic(token.jwt)}`);
    }
};