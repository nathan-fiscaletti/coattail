const Peer = require(`../../../peer`);
const log = require(`../../../log`);
const { omit } = require(`lodash`);

const commandLineArgs = require('command-line-args');

const printHelp = () => {

};

module.exports = (cli) => {
    const logger = log('CLI');

    const options = commandLineArgs([
        { name: "help", alias: 'h', type: Boolean },
        { name: "subscribable" },
        { name: "performable" },
        { name: "publishable" },
        { name: "not-before", alias: 'n' },
        { name: "expires-in", alias: 'e' }
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
                    }
                ]
            },
            {
                header: "Example",
                content: [
                    {
                        desc: '1. Issue a new token that can be used in 1 week and expires in 2 weeks. This token will be able to subscribe to any action, but cannot perform or publish any actions.',
                        example: 'coattail token issue --not-before 1w --expires-in 2w'
                    },
                    {
                        desc: '2. Issue a new token that can be used immediately and never expires. This token will be able to subscribe to any action, perform the the "reload members" and "update members" actions, but cannot publish any actions.',
                        example: `coattail token issue --performable '["members.reload", "members.update"]'`
                    },
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

    let subscribable = ['*'];
    let performable = [];
    let publishable = [];
    let notBefore = options.notBefore;
    let expiresIn = options.expiresIn;

    const validateJsonArray = (name, arr) => {
        let parsed;
        try {
            parsed = JSON.parse(arr);
        } catch (err) {
            console.error(`Invalid JSON array provided for '${name}'.`);
            console.error(err);
            return false;
        }
        if (!Array.isArray(parsed)) {
            console.error(`Invalid JSON array provided for '${name}'.`);
            console.error('Value must be a JSON array.');
            return false;
        }
        for(const parsedVal of parsed) {
            if (typeof parsedVal !== 'string') {
                console.error(`Invalid JSON array provided for '${name}'.`);
                console.error('Value must be strings.');
            }
            return false;
        }
        return parsedVal;
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

    const config = require(`../../../server/config`).load();
    const peer = Peer.issueToken(config, {
        performable,
        publishable,
        subscribable,
        notBefore,
        expiresIn
    });
    logger.object(`Issued Peer`, omit(peer.getPrintable(), ['id']));
    logger.info(`Token: ${peer.token}`);
};