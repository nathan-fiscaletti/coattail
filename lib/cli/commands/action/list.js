const templates = require(`../../../templates`);
const path = require(`path`);
const fs = require(`fs`);
const commandLineArgs = require('command-line-args');

const options = [
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
];

const printHelp = cli => cli.printHelp([
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
        optionList: options
    }
]);

module.exports = async cli => {
    const parameters = commandLineArgs(options, {
        argv: cli.argv, stopAtFirstUnknown: true
    });

    if (parameters.help) {
        printHelp(cli);
        return;
    }
};