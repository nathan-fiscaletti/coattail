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
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
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

        if (tokens.length > 0) {
            const output = table(data, {
                border: getBorderCharacters('void'),
                columnDefault: {
                    paddingLeft: 1,
                    paddingRight: 1
                },
                drawHorizontalLine: () => false
            });

            const outputLines = output.split(/\r?\n/)
            cli.success(
                `Loaded Validation Tokens`,
                [
                    ...outputLines.slice(0, outputLines.length - 1).map(l => l.slice(1))
                ]
            );
        } else {
            cli.success(
                `Loaded Validation Tokens`,
                chalk.hex('#e64e4e')('No Validation Tokens loaded.')
            );
        }
    });
};