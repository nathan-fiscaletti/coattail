const Token = require(`../../../token`);
const chalk = require(`chalk`);
const commandLineArgs = require('command-line-args');

const options = [
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
        description: 'The ID of the token you wish to revoke.',
        defaultOption: true
    },
    {
        name: 'force',
        aliase: 'f',
        description: 'Forcefully revokes the token without asking for confirmation.',
        type: Boolean,
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

    if (!cli.validateRequired(parameters, ['id'])) {
        printHelp(cli);
        return;
    }

    try {
        const token = await Token.load(parameters);
        if (token === undefined) {
            throw new Error('No token exists with that ID.');
        }

        console.log('');
        console.log(chalk.bold(` Token to Revoke`));
        token.print({showId: true});
        const proceed = parameters.force || await cli.yesOrNo(' Are you sure you want to revoke this token?');
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