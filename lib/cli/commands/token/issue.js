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
        name: 'config',
        alias: 'c',
        description: 'The path to the configuration file to use when storing Tokens. Defaults to the config.yml file stored in the root of your Coattail installation.',
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
            console.error(`${chalk.hex('#e64e4e')('Error')}: Invalid JSON array provided for '${name}'.`);
            console.error(err);
            return false;
        }
        if (!Array.isArray(parsed)) {
            console.error(`${chalk.hex('#e64e4e')('Error')}: Invalid JSON array provided for '${name}'.`);
            console.error(`${chalk.hex('#e64e4e')('Error')}: Value must be a JSON array.`);
            return false;
        }
        for(const parsedVal of parsed) {
            if (typeof parsedVal !== 'string') {
                console.error(`${chalk.hex('#e64e4e')('Error')}: Invalid JSON array provided for '${name}'.`);
                console.error(`${chalk.hex('#e64e4e')('Error')}: Value must be strings.`);
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
    config.load(parameters.config);
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
        console.error(`${chalk.hex('#e64e4e')('Error')}: Failed to issue new token.`);
        console.error(`${chalk.hex('#e64e4e')('Error')}: ${err}`);
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
    console.log(` ${chalk.bold(`New Token Generated!`)}`);
    token.print({showId: true});
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