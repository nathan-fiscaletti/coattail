const templates = require(`../../../templates`);
const path = require(`path`);
const fs = require(`fs`);

const commandLineArgs = require('command-line-args');
module.exports = (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean},
        { name: 'peer', alias: 'p' }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
            {
                header: 'Coattail -- List Actions',
                content: 'Lists actions on an instance.'
            },
            {
                header: 'Usage',
                content: [
                    `$ coattail action list [options]`
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
                        description: 'The peer you want to list actions for. Defaults to local Coattail instance.'
                    }
                ]
            }
        ]);
        return;
    }
};