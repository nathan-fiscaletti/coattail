const Token = require(`../../../token`);
const commandLineArgs = require('command-line-args');
const { table, getBorderCharacters  } = require(`table`);
const chalk = require(`chalk`);

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    }
];

const printHelp = cli => cli.printHelp([
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

    Token.loadAll().then(tokens => {
        const data = [[chalk.hex('#4e88e6').bold('Token ID'), chalk.hex('#4e88e6').bold('Valid Bearers')]];
        for (const token of tokens) {
            const claims = token.claims();

            data.push([
                chalk.italic(token.id),
                chalk.italic(claims.validBearers.includes('0.0.0.0/0') ? chalk.hex('#e6d74e')('Any') : claims.validBearers.join('\n'))
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