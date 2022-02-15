const Token = require(`../../../token`);
const { connect } = require(`../../../data/connection`);
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
                header: 'Coattail -- List Tokens',
                content: 'Lists all tokens issued by this Coattail instance.'
            },
            {
                header: 'Usage',
                content: [
                    `$ coattail token list [options]`
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

    const database = connect();
    Token.loadAll(database).then(tokens => {
        database.destroy();
        const data = [[chalk.hex('#4e88e6').bold('Token ID'), chalk.hex('#4e88e6').bold('Valid Sources')]];
        for (const token of tokens) {
            const claims = token.claims();

            data.push([
                chalk.italic(token.id),
                'TODO'
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
        console.log(` ${chalk.bold.underline('Issued Tokens')}`);
        console.log('');
        console.log(chalk.italic(` Use 'coattail token show --id <id>' for more information on a token.`));
        console.log('');
        console.log(output);
    });
};