const ValidationToken = require(`../../../validation-token`);
const chalk = require(`chalk`);

const commandLineArgs = require('command-line-args');

module.exports = async (cli) => {
    const options = commandLineArgs([
        { name: "help", alias: 'h', type: Boolean },
        { name: "id", alias: 'i' },
        { name: "force", alias: 'f', type: Boolean }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
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
                optionList: [
                    {
                        name: 'help',
                        alias: 'h',
                        description: 'Shows this help message.',
                        type: Boolean
                    },
                    {
                        name: 'id',
                        alias: 'i',
                        typeLabel: '{underline token-id}',
                        description: 'The ID of the validation token you wish to revoke.'
                    },
                    {
                        name: 'force',
                        aliase: 'f',
                        description: 'Forcefully removes the token without asking for confirmation.',
                        type: Boolean,
                    }
                ]
            }
        ]);
        return;
    }

    if(!options.id) {
        cli.missing('id');
        return;
    }

    try {
        const token = await ValidationToken.load({id: options.id});
        if (token === undefined) {
            throw new Error('No validation token exists with that ID.');
        }

        console.log('');
        console.log(chalk.bold(` Validation Token to Remove`));
        token.print({showId: true});
        const proceed = options.force || await cli.yesOrNo(' Are you sure you want to remove this token?');
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