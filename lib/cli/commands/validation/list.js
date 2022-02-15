const ValidationToken = require(`../../../validation-token`);
const commandLineArgs = require('command-line-args');
const { table, getBorderCharacters  } = require(`table`);
const chalk = require(`chalk`);

module.exports = async (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
            {
                header: 'Coattail -- List Validation Tokens',
                content: 'Lists all validation tokens loaded into this Coattail instance.'
            },
            {
                header: 'Usage',
                content: [
                    `$ coattail validation list [options]`
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
                    }
                ]
            }
        ]);
        return;
    }

    ValidationToken.loadAll().then(tokens => {
        const data = [[chalk.hex('#4e88e6').bold('Token ID'), chalk.hex('#4e88e6').bold('Issuer')]];
        for (const token of tokens) {
            data.push([
                chalk.italic(token.id),
                chalk.italic(token.issuer())
            ]);
        }

        const output = table(data, {
            border: getBorderCharacters('void'),
            columnDefault: {
                paddingLeft: 1,
                paddingRight: 1
            },
            drawHorizontalLine: () => false
        });

        console.log('');
        console.log(` ${chalk.bold.underline('Loaded Tokens')}`);
        console.log('');
        console.log(chalk.italic(` Use 'coattail validation show --id <id>' for more information on a validation token.`));
        console.log('');
        console.log(output);
    });
};