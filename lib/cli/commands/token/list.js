const package = require('../../../../package.json');
const fs = require('fs');
const path = require('path');
const Token = require(`../../../tokens/token`);
const commandLineArgs = require('command-line-args');
const { table, getBorderCharacters  } = require(`table`);
const chalk = require(`chalk`);
const config = require(`../../../config`);

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

    try {
        const v = fs.readFileSync(path.join(parameters.instance || process.cwd(), '.ct.version'), 'utf8');
        if (v !== package.version) {
            cli.error(`This instance is using Coattail v${v}, but the CLI is v${package.version}.`, `Please install version ${v} of the Coattail CLI to manage this instance.`);
            return;
        }
    } catch (_) {
        cli.error(`This command must be run from the root directory of a Coattail instance.`);
        return;
    }

    try {
        config.load(parameters.instance);
    } catch (_) {
        cli.error(`Unable to locate 'config.yml' in '${parameters.instance || './'}'`);
        return;
    }

    Token.loadAll().then(tokens => {
        const data = [[chalk.hex('#4e88e6').bold('Token ID'), chalk.hex('#4e88e6').bold('Type'), chalk.hex('#4e88e6').bold('Valid Bearers')]];
        for (const token of tokens) {
            const claims = token.claims();

            let useColor = chalk.hex('#6ce64e');
            const use = token.use();
            if (use === Token.Uses.AUTHENTICATING) {
                useColor = chalk.hex('#e6d74e');
            }

            data.push([
                chalk.italic(token.id),
                useColor(use),
                chalk.italic(claims.validBearers.includes('0.0.0.0/0') ? chalk.hex('#e6d74e')('Any') : claims.validBearers.join('\n'))
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
                `Issued Tokens`,
                [
                    ...outputLines.slice(0, outputLines.length - 1).map(l => l.slice(1))
                ]
            );
        } else {
            cli.success(
                `Issued Tokens`,
                chalk.hex('#e64e4e')('No tokens issued.')
            );
        }
    });
};