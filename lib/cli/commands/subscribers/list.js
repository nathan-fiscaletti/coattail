const package = require('../../../../package.json');
const fs = require('fs');
const path = require('path');
const Subscription = require(`../../../subscription`);
const commandLineArgs = require('command-line-args');
const { table, getBorderCharacters  } = require(`table`);
const chalk = require(`chalk`);
const config = require(`../../../config`);

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
    }
];

const printHelp = cli => cli.printHelp([
    {
        header: 'Coattail -- List Subscribers',
        content: 'Lists all active subscriptions from peers on this Coattail instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail subscribers list [options]`
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

    Subscription.loadAll().then(subscriptions => {
        const data = [[
            chalk.hex('#4e88e6').bold('Subscription ID'),
            chalk.hex('#4e88e6').bold('Connection'),
            chalk.hex('#4e88e6').bold('Subscribed To'),
            chalk.hex('#4e88e6').bold('Subscribed with Token')
        ]];

        for (const subscriber of subscriptions) {
            data.push([
                chalk.italic(subscriber.id),
                chalk.italic(`${subscriber.claims().host}:${subscriber.claims().port}`),
                chalk.italic(subscriber.subscribedTo().join(',')),
                chalk.italic(subscriber.claims().authenticationTokenId)
            ]);
        }

        if (subscriptions.length > 0) {
            const output = table(data, {
                border: getBorderCharacters('void'),
                columnDefault: {
                    paddingLeft: 1,
                    paddingRight: 1
                },
                drawHorizontalLine: () => false
            });


            const outputLines = output.split(/\r?\n/)
            cli.success(
                `Active Subscriptions`,
                [
                    ...outputLines.slice(0, outputLines.length - 1).map(l => l.slice(1))
                ]
            );
        } else {
            cli.success(
                `Subscribers`,
                chalk.hex('#e64e4e')('No subscribers subscribed to this Coattail instance.')
            );
        }
    });
};