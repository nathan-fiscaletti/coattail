const templates = require(`../../../templates`);
const path = require(`path`);
const fs = require(`fs`);

const commandLineArgs = require('command-line-args');
module.exports = (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean},
        { name: 'peer', alias: 'p' },
        { name: 'action', alias: 'a' },
        { name: 'data', alias: 'd' }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
            {
                header: 'Coattail -- Publish Action',
                content: 'Publishes data to the subscribers of an action.'
            },
            {
                header: 'Usage',
                content: [
                    `$ coattail action publish [options]`
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
                        description: 'The peer you want to publish data to the subscribers of. Defaults to local Coattail instance.'
                    },
                    {
                        name: 'action',
                        alias: 'a',
                        typeLabel: '{underline id|name}',
                        description: 'The action the data correlates to.'
                    },
                    {
                        name: 'data',
                        alias: 'd',
                        typeLabel: '{underline file|data}',
                        description: 'The data to send to the subscribers.'
                    }
                ]
            }
        ]);
        return;
    }
};