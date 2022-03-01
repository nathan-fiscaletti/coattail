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
        name: 'instance',
        alias: 'i',
        description: 'The path to the local Coattail Instance.',
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