const Peer = require(`../../../peer`);
const commandLineArgs = require('command-line-args');
const moment = require(`moment`);
const { table, getBorderCharacters  } = require(`table`);
const chalk = require(`chalk`);

module.exports = async (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
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

        console.log('');
        console.log(` ${chalk.bold.underline('Registered Peers')}`);
        console.log('');
        console.log(chalk.italic(` Use 'coattail peer show --id <id>' for more information on a peer.`));
        console.log('');
        console.log(output);
    });
};