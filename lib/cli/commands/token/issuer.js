const package = require('../../../../package.json');
const fs = require('fs');
const path = require('path');
const Token = require(`../../../tokens/token`);
const commandLineArgs = require('command-line-args');
const config = require(`../../../config`);
const chalk = require(`chalk`);

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
        header: 'Coattail -- Get Token Issuer',
        content: 'Retreives the token issuer that should be used as the CN for TLS certificates.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail token issuer [options]`
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

    cli.success('Token Issuer', [
        chalk.italic(`This should be used as the CN when generating self signed TLS certificates`),
        '',
        `${chalk.hex('#4e88e6')(Token.getTokenIssuer())}`
    ]);
};