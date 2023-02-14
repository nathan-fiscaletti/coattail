const package = require('../../../../package.json');
const fs = require('fs');
const path = require('path');
const commandLineArgs = require('command-line-args');
const chalk = require(`chalk`);
const config = require(`../../../config`);
const { Peer } = require('../../../..');

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
        description: 'The peer that the action you are un-subscribing from is published from.'
    },
    {
        name: 'action',
        alias: 'a',
        typeLabel: '{underline name}',
        description: 'The action that you are unsubscribing from.'
    },
    {
        name: 'receiver',
        alias: 'r',
        typeLabel: '{underline name}',
        description: 'The receiver that you want to unsubscribe from the action.'
    },
    {
        name: 'verbose',
        alias: 'v',
        type: Boolean,
        description: `Display verbose output.`
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
        header: 'Coattail -- Unsubscribe',
        content: 'Unsubscribes from an action on an instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail action unsubscribe [options]`
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

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    const peer = await Peer.load({id: parameters.peer});
    if (peer === undefined) {
        cli.error(`Peer not found. Make sure you're providing the ID for a peer you've registered.`);
        return;
    }

    peer.unsubscribe(parameters).then(() => {
        cli.success('Unsubscribed from publisher', [
            `Unsubscribed from action ${chalk.hex('#4e88e6')(parameters.action)} with receiver ${chalk.hex('#4e88e6')(parameters.receiver)} on peer ${chalk.hex('#e6d74e')(parameters.peer)}`
        ]);
    }).catch(error => {
        cli.error('Failed to unsubscribe from publisher.', error.stack || `${error}`);
    });
};