const Peer = require(`../../../peer`);
const { connect } = require(`../../../data/connection`);
const commandLineArgs = require('command-line-args');
const moment = require(`moment`);
const Table = require('cli-table');
const c = require('ansi-colors');

module.exports = (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean },
        { name: "id", alias: 'i' }
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

    const database = connect();
    Peer.load(database, options.id).then(peer => {
        database.destroy();

        if (peer === undefined) {
            console.error(`${c.red('Error')}: No peer found for that ID.`);
            return;
        }

        const claims = peer.claims();

        let host = `${claims.host}:${claims.port}`;
        if (claims.tls) {
            host = `TLS ${host}`;
        }

        let effective_at = 'now';
        if (claims.nbf) {
            const nbf = moment(claims.nbf * 1000);
            if (moment().diff(nbf) > 0) {
                effective_at = nbf.toISOString();
            }
        }

        let expires_at = 'never';
        if (claims.exp) {
            expires_at = moment(claims.exp * 1000).toISOString();
        }

        console.log('');
        console.log(` ${c.bold(`Peer ${c.underline(peer.id)}`)}`);
        console.log('');

        const table = new Table({style: { head:['green'] }});
        table.push(
            {'ID': peer.id},
            {'Issued At': moment(claims.iat * 1000).toISOString()},
            {'Effective At': effective_at},
            {'Expires At': expires_at},
            {'Issuer': host},
            {'Performable': claims.performable},
            {'Publishable': claims.publishable},
            {'Subscribable': claims.subscribable}
        );

        console.log(table.toString());
        console.log('');
    });
};