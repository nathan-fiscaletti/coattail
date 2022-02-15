const Token = require(`../../../token`);
const commandLineArgs = require('command-line-args');
const chalk = require(`chalk`);

module.exports = async (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean },
        { name: "id", alias: 'i', defaultOption: true },
        { name: "print-raw-token", type: Boolean }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
            {
                header: 'Coattail -- Show Token',
                content: 'Shows information for a particular token issued by this Coattail instance.'
            },
            {
                header: 'Usage',
                content: [
                    `$ coattail token show [options]`
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
                        description: 'The ID of the token you wish to view.'
                    },
                    {
                        name: "print-raw-token",
                        description: "Prints the raw token to the output",
                        type: Boolean
                    }
                ]
            }
        ]);
        return;
    }

    if (options.id === undefined) {
        cli.missing('id');
        return;
    }

    options.printRawToken = options['print-raw-token'];

    Token.load(options).then(token => {
        if (token === undefined) {
            console.error(`${chalk.hex('#e64e4e')('Error')}: No token found for that ID.`);
            return;
        }

        console.log('');
        console.log(` ${chalk.bold(`Token ${chalk.underline(token.id)}`)}`);
        token.print({showId: false});
        if (options.printRawToken) {
            console.log(` ${chalk.hex('#6ce64e').underline('Raw Token')}`);
            console.log('');
            console.log(` ${chalk.italic(token.jwt)}`);
            console.log('');
        }
    });
};