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
        name: 'id',
        description: 'The ID of the validation token you wish to view.',
        defaultOption: true
    },
    {
        name: "print-raw-token",
        description: "Prints the raw token to the output",
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
        header: 'Coattail -- Show Validation Token',
        content: 'Shows information for a particular validation token loaded into this Coattail instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail validation show [options]`
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

    if(!cli.validateRequired(parameters, ['id'])) {
        return;
    }

    parameters.printRawToken = parameters['print-raw-token'];

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    ValidationToken.load(parameters).then(token => {
        if (token === undefined) {
            cli.error(`No validation token found for with ID '${parameters.id}'.`);
            return;
        }

        let lines;
        token.print({showId: true, outputHandler: l => lines = l});

        cli.success(`Validation Token ${chalk.underline(token.id)}`, [
            ...lines.slice(0, lines.length - 1).map(l => l.slice(1)),
        ]);

        if (parameters.printRawToken) {
            cli.raw(`${chalk.hex('#6ce64e').underline('Raw Token')}: ${chalk.italic(token.jwt)}`);
        }
    });
};