const ValidationToken = require(`../../../tokens/validation-token`);
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
        description: 'The ID of the validation token you wish to revoke.',
        defaultOption: true
    },
    {
        name: 'force',
        aliase: 'f',
        description: 'Forcefully removes the token without asking for confirmation.',
        type: Boolean,
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
        header: 'Coattail -- Remove Validation Token',
        content: 'Removes a validation token.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail validation remove [options]`
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

    if(!cli.validateRequired(parameters, ['id'])) {
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    cli.waiting(`Removing Validation Token '${parameters.id}'...`);

    try {
        const token = await ValidationToken.load({id: parameters.id});
        if (token === undefined) {
            throw new Error(`No validation token exists with ID '${parameters.id}'.`);
        }

        await token.delete();
        cli.success(`Validation Token '${parameters.id}' removed!`);
    } catch (err) {
        cli.error(`Failed to remove Validation Token '${parameters.id}'.`, err.stack || `${err}`);
    }
};