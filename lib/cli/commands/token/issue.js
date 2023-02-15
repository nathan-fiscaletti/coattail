const package = require('../../../../package.json');
const fs = require('fs');
const path = require('path');
const Token = require(`../../../tokens/token`);
const chalk = require(`chalk`);
const clipboardy = require(`clipboardy`);
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
        name: 'bearers',
        alias: 'b',
        typeLabel: '{underline array}',
        description: `A JSON array of strings representing valid bearers for this token. Each bearer should use the format 'vt://<validation-token-id>' or 'ipv4://<ipv4-subnet-with-cidr>'. Defaults to ipv4://0.0.0.0/0.`
    },
    {
        name: 'subscribable',
        typeLabel: '{underline array}',
        description: 'A JSON array of action names that this token can be used to subscribe to. Defaults to all actions.'
    },
    {
        name: 'performable',
        typeLabel: '{underline array}',
        description: 'A JSON array of action names that this token can be used to perform remotely on this Coattail instance. Defaults to no actions.'
    },
    {
        name: 'publishable',
        typeLabel: '{underline array}',
        description: 'A JSON array of action names that this token can be used to perform remotely on this Coattail instance. Defaults to no actions.'
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
        header: 'Coattail -- Issue Token',
        content: 'Issues a new token.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail token issue [options]`
        ]
    },
    {
        header: 'Options',
        optionList: options
    },
    {
        header: "Example",
        content: [
            {
                desc: '1. Issue a new token that can be used in 1 week and expires in 2 weeks. This token will be able to subscribe to any action, but cannot perform or publish any actions.',
                example: chalk.hex('#4e88e6')('coattail token issue --not-before 1w --expires-in 2w')
            },
            {
                desc: '2. Issue a new token that can be used immediately and never expires. This token will be able to subscribe to any action, perform the the "reload members" and "update members" actions, but cannot publish any actions.',
                example: chalk.hex('#4e88e6')(`coattail token issue --performable '["members.reload", "members.update"]'`)
            },
            {
                desc: '3. Issue a new token that can be used immediately and never expires. This token will only be usable by a system connecting from within the 192.168.0.0/24 RFC1918 address space.',
                example: chalk.hex('#4e88e6')(`coattail token issue --bearers '["192.168.0.0/24"]'`)
            }
        ]
    },
    {
        content: "See docs/token-issuance.md for more information."
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
        cli.error(`This command must be run from the root directory of a Coattail instance.`);
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    parameters.notBefore = parameters['not-before'];
    parameters.expiresIn = parameters['expires-in'];
    parameters.printRawToken = parameters['print-raw-token'];

    let subscribable = ['*'];
    let performable = [];
    let publishable = [];
    let validBearers = ['ipv4://0.0.0.0/0'];
    let notBefore = parameters.notBefore;
    let expiresIn = parameters.expiresIn;

    const validateJsonArray = (name, arr) => {
        let parsed;
        try {
            parsed = JSON.parse(arr);
        } catch (err) {
            cli.error(`Invalid JSON array provided for '${name}'.`, err.stack || `${err}`);
            return false;
        }
        if (!Array.isArray(parsed)) {
            cli.error(`Invalid JSON array provided for '${name}'.`, `Value must be a JSON array containing only strings.`);
            return false;
        }
        for(const parsedVal of parsed) {
            if (typeof parsedVal !== 'string') {
                cli.error(`Invalid JSON array provided for '${name}'.`, `Value must be a JSON array containing only strings.`);
                return false;
            }
        }
        return parsed;
    };

    if (parameters.subscribable) {
        subscribable = validateJsonArray('subscribable', parameters.subscribable);
        if (subscribable === false) {
            return;
        }
    }

    if (parameters.performable) {
        performable = validateJsonArray('performable', parameters.performable);
        if (performable === false) {
            return;
        }
    }

    if (parameters.publishable) {
        publishable = validateJsonArray('performable', parameters.publishable);
        if (publishable === false) {
            return;
        }
    }

    if (parameters.bearers) {
        validBearers = validateJsonArray('bearers', parameters.bearers);
        if (validBearers === false) {
            return;
        }
    }

    let token;
    try {
        token = await Token.issue({
            validBearers,
            performable,
            publishable,
            subscribable,
            notBefore,
            expiresIn
        });
    } catch (err) {
        cli.error(`Failed to issue new token.`, err.stack || `${err}`);
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
    token.print({showId: true, outputHandler: l => lines = l});

    const extraLines = [];
    if(!parameters.printRawToken) {
        clipboardy.writeSync(token.jwt);
        extraLines.push('');
        extraLines.push(chalk.hex('#6ce64e').underline('Raw token copied to clipboard!'));
    }

    cli.success(`New Token Generated!`, [
        ...lines.slice(0, lines.length - 1).map(l => l.slice(1)),
        ...extraLines
    ]);

    if (parameters.printRawToken) {
        cli.raw(`${chalk.hex('#6ce64e').underline('Raw Token')}: ${chalk.italic(token.jwt)}`);
    }
};