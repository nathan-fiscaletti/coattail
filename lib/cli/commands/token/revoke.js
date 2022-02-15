const Token = require(`../../../token`);
const chalk = require(`chalk`);
const { connect } = require(`../../../data/connection`);

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
                        description: 'The ID of the token you wish to revoke.'
                    },
                    {
                        name: 'force',
                        aliase: 'f',
                        description: 'Forcefully revokes the token without asking for confirmation.',
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

    const connection = connect();
    try {
        const token = await Token.load(connection, options.id);
        if (token === undefined) {
            throw new Error('No token exists with that ID.');
        }

        console.log('');
        console.log(chalk.bold(` Token to Revoke`));
        token.print({showId: true});
        const proceed = await cli.yesOrNo(' Are you sure you want to delete this token?');
        if (proceed) {
            await token.revoke(connection);
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
    } finally {
        connection.destroy();
    }
};