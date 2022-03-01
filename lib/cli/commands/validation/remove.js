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
        printHelp(cli);
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        console.log('');
        console.error(` State: ${chalk.hex('#e64e4e')('Error')}`);
        console.log('');
        console.error(` ${chalk.hex('#e64e4e')('Error')}: Unable to location coattail instance in location '${parameters.instance || './'}'`);
        console.log('');
        return;
    }

    try {
        const token = await ValidationToken.load({id: parameters.id});
        if (token === undefined) {
            throw new Error('No validation token exists with that ID.');
        }

        console.log('');
        console.log(chalk.bold(` Validation Token to Remove`));
        token.print({showId: true});
        const proceed = parameters.force || await cli.yesOrNo(' Are you sure you want to remove this token?');
        if (proceed) {
            await token.delete();
            console.log('');
            console.log(chalk.bold(` Status: ${chalk.hex('#6ce64e')('Success!')}`));
            console.log('');
        }
    } catch (err) {
        console.error('');
        console.error(chalk.bold(` Status: ${chalk.hex('#e64e4e')('Failed!')}`));
        console.error('');
        console.error(` ${chalk.hex('#e64e4e')('Error')}: ${err}`);
        console.error('');
    }
};