const package = require('../../../../package.json');
const fs = require('fs');
const path = require('path');
const Token = require(`../../../tokens/token`);
const chalk = require(`chalk`);
const commandLineArgs = require('command-line-args');
const config = require('../../../config');

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'id',
        typeLabel: '{underline token-id}',
        description: 'The ID of the token you wish to revoke.',
        defaultOption: true
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
        header: 'Coattail -- Revoke Token',
        content: 'Revokes a token.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail token revoke [options]`
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

    if (!cli.validateRequired(parameters, ['id'])) {
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    try {
        const token = await Token.load(parameters);
        if (token === undefined) {
            throw new Error('No token exists with that ID.');
        }

        cli.waiting(`Revoking token '${parameters.id}'...`);

        await token.delete();
        cli.success(`Token '${parameters.id}' revoked.`);
    } catch (err) {
        cli.error(`Failed to revoke token ${parameters.id}.`, err.stack || `${err}`);
    }
};