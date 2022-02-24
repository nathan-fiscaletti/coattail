const templates = require(`../../../templates`);
const path = require(`path`);
const fs = require(`fs`);
const commandLineArgs = require('command-line-args');
const { config } = require('process');

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
        description: 'The peer you want to publish data to the subscribers of. Defaults to local Coattail instance.'
    },
    {
        name: 'action',
        alias: 'a',
        typeLabel: '{underline name}',
        description: 'The action the data correlates to.'
    },
    {
        name: 'data',
        alias: 'd',
        typeLabel: '{underline file|data}',
        description: 'The data to send to the subscribers.'
    },
    {
        name: 'config',
        alias: 'c',
        description: 'The path to the configuration file to use when publishing the action. Defaults to the config.yml file stored in the root of your Coattail installation.',
        typeLabel: '{underline path}'
    }
];

const printHelp = cli => cli.printHelp([
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

    config.load(parameters.config);
};