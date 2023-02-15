const package = require('../../../../package.json');
const fs = require('fs');
const path = require('path');
const ValidationToken = require(`../../../tokens/validation-token`);
const commandLineArgs = require('command-line-args');
const chalk = require(`chalk`);
const config = require('../../../config');

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'token',
        alias: 't',
        description: 'The validation token.',
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
        header: 'Coattail -- Add Signature Validation Token',
        content: 'Adds a new validation token to this Coattail instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail validation add [options]`
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

    if(!cli.validateRequired(parameters, ['token'])) {
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    let vt;
    try {
        vt = new ValidationToken({jwt: parameters.token});
        await vt.save();

        let lines;
        vt.print({showId: true, outputHandler: l => lines = l})
        cli.success(`Validation Token added.`, [
            ...lines.slice(0, lines.length - 1).map(l => l.slice(1))
        ]);
    } catch (err) {
        cli.error(`Failed to add validation token.`, err.stack || `${err}`);
    }
};