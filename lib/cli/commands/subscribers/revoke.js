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
        name: 'instance',
        alias: 'i',
        description: 'The path to the local Coattail Instance.',
        typeLabel: '{underline path}'
    },
    {
        name: 'subscription',
        alias: 's',
        description: 'The ID of the subscription you wish to revoke.',
        defaultOption: true
    },
    {
        name: 'verbose',
        alias: 'v',
        type: Boolean,
        description: `Display verbose output.`
    }
];

const printHelp = cli => cli.printHelp([
    {
        header: 'Coattail -- Revoke Subscription',
        content: 'Revokes a subscription, notifying the peer that it will not longer receive notifications.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail subscribers revoke [options]`
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
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    try {
        await Peer.local().revokeSubscription({
            subscriptionId: parameters.subscription,
            verbose: parameters.verbose
        });
        cli.success(`Revoked subscription.`);
    } catch (error) {
        cli.error('Failed to revoke subscription.', error.stack || `${error}`);
        return;
    }
};