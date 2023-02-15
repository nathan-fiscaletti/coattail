const package = require('../../../../package.json');
const fs = require('fs');
const path = require('path');
const Peer = require(`../../../peer`);
const commandLineArgs = require('command-line-args');
const moment = require(`moment`);
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
        header: 'Coattail -- List Peers',
        content: 'Lists all peers currently registered on this Coattail instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail peer list [options]`
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

    cli.waiting(`Loading peers...`);

    Peer.loadAll().then(peers => {
        const data = [[chalk.hex('#4e88e6').bold('ID'), chalk.hex('#4e88e6').bold('Connection')]];
        for (const peer of peers) {
            const claims = peer.token.claims();

            let host = `${claims.host}:${claims.port}`;
            if (claims.tls) {
                host = `${chalk.hex('#6ce64e')('TLS')} ${host}`;
            } else {
                host = `${chalk.hex('#e6d74e')('TCP')} ${host}`;
            }

            data.push([
                chalk.italic(peer.id),
                chalk.italic(host)
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


        const outputLines = output.split(/\r?\n/)
        cli.success(
            `Registered Peers`,
            [
                ...outputLines.slice(0, outputLines.length - 1).map(l => l.slice(1))
            ]
        );
    });
};