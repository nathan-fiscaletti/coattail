const ValidationToken = require(`../../../tokens/validation-token`);
const commandLineArgs = require('command-line-args');
const { table, getBorderCharacters  } = require(`table`);
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
        name: 'config',
        alias: 'c',
        description: 'The path to the configuration file to use when loading Tokens. Defaults to the config.yml file stored in the root of your Coattail installation.',
        typeLabel: '{underline path}'
    }
];

const printHelp = cli => cli.printHelp([
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

    config.load(parameters.config);

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