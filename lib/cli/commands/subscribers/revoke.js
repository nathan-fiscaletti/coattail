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
        const v = fs.readFileSync(path.join(parameters.instance || process.cwd(), '.ct.version'), 'utf8');
        if (v !== package.version) {
            cli.error(`This instance is using Coattail v${v}, but the CLI is v${package.version}.`, `Please install version ${v} of the Coattail CLI to manage this instance.`);
            return;
        }
    } catch (_) {
        cli.error(`This command must be run from the root directory of a Coattail instance.`);
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