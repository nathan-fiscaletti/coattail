const templates = require(`../../../templates`);
const path = require(`path`);
const fs = require(`fs`);

const commandLineArgs = require('command-line-args');
module.exports = async (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean},
        { name: 'peer', alias: 'p' },
        { name: 'action', alias: 'a' },
        { name: 'receiver', alias: 'r' }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
            {
                header: 'Coattail -- Subscribe to Action',
                content: 'Subscribes to an action on an instance.'
            },
            {
                header: 'Usage',
                content: [
                    `$ coattail action subscribe [options]`
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
                        name: 'peer',
                        alias: 'p',
                        typeLabel: '{underline id}',
                        description: 'The peer that the action you are subscribing to is published from.'
                    },
                    {
                        name: 'action',
                        alias: 'a',
                        typeLabel: '{underline name}',
                        description: 'The action the data correlates to.'
                    },
                    {
                        name: 'receiver',
                        alias: 'r',
                        typeLabel: '{underline name}',
                        description: 'The action that should handle incoming publications from the publisher.'
                    }
                ]
            }
        ]);
        return;
    }
};