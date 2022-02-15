const Peer = require(`../../../peer`);
const { connect } = require(`../../../data/connection`);
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
                header: 'Coattail -- Show Peer',
                content: 'Shows information for a particular peer registered on this Coattail instance.'
            },
            {
                header: 'Usage',
                content: [
                    `$ coattail peer show [options]`
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
                        description: 'The ID of the peer you wish to view.'
                    },
                    {
                        name: "print-raw-token",
                        description: "Prints the raw token for the specified peer to the output",
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

    const database = connect();
    Peer.load(database, options.id).then(peer => {
        database.destroy();

        if (peer === undefined) {
            console.error(`${chalk.hex('#e64e4e')('Error')}: No peer found for that ID.`);
            return;
        }

        console.log('');
        console.log(` ${chalk.bold(`Peer ${chalk.underline(peer.id)}`)}`);
        peer.token.print({showId: false});
        if (options.printRawToken) {
            console.log(` ${chalk.hex('#6ce64e').underline('Raw Token')}`);
            console.log('');
            console.log(` ${chalk.italic(peer.token.jwt)}`);
            console.log('');
        }
    });
};