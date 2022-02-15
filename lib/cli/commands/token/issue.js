const Token = require(`../../../token`);
const { connect } = require(`../../../data/connection`);
const chalk = require(`chalk`);
const clipboardy = require(`clipboardy`);

const commandLineArgs = require('command-line-args');

module.exports = async (cli) => {
    const options = commandLineArgs([
        { name: "help", alias: 'h', type: Boolean },
        { name: "bearers", alias: 'b' },
        { name: "subscribable" },
        { name: "performable" },
        { name: "publishable" },
        { name: "not-before", alias: 'n' },
        { name: "expires-in", alias: 'e' },
        { name: "quiet", alias: 'q', type: Boolean },
        { name: "print-raw-token", alias: 'r', type: Boolean }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
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
                optionList: [
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
                        description: 'A JSON array of strings representing IPv4 subnets formatted with CIDR notation. These subnets define source IPs that are allowed to bear this token. Defaults to 0.0.0.0/0.'
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
                    }
                ]
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
        return;
    }

    options.notBefore = options['not-before'];
    options.expiresIn = options['expires-in'];
    options.printRawToken = options['print-raw-token'];

    let subscribable = ['*'];
    let performable = [];
    let publishable = [];
    let validBearers = ['0.0.0.0/0'];
    let notBefore = options.notBefore;
    let expiresIn = options.expiresIn;

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

    if (options.subscribable) {
        subscribable = validateJsonArray('subscribable', options.subscribable);
        if (subscribable === false) {
            return;
        }
    }

    if (options.performable) {
        performable = validateJsonArray('performable', options.performable);
        if (performable === false) {
            return;
        }
    }

    if (options.publishable) {
        publishable = validateJsonArray('performable', options.publishable);
        if (publishable === false) {
            return;
        }
    }

    if (options.bearers) {
        validBearers = validateJsonArray('bearers', options.bearers);
        if (validBearers === false) {
            return;
        }
    }

    let token;
    const config = require(`../../../server/config`).load();
    const connection = connect();
    try {
        token = await Token.issue(config, connection, {
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
    } finally {
        connection.destroy();
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
    console.log(` ${chalk.bold(`New Token Generated!`)}`);
    token.print({showId: true});
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