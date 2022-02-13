const Peer = require(`../../../peer`);
const { connect } = require(`../../../data/connection`);
const commandLineArgs = require('command-line-args');
const moment = require(`moment`);
const Table = require('cli-table');
const c = require('ansi-colors');

module.exports = async (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean },
        { name: "detailed", alias: 'd', type: Boolean }
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
                    },
                    {
                        name: 'detailed',
                        alias: 'd',
                        description: 'Whether or not to display all details for the peers.'
                    }
                ]
            }
        ]);
        return;
    }

    const database = connect();
    Peer.loadAll(database).then(peers => {
        database.destroy();
        const data = [];
        let head = ['ID', 'Issuer'];
        for (const peer of peers) {
            const claims = peer.claims();

            let host = `${claims.host}:${claims.port}`;
            if (claims.tls) {
                host = `TLS ${host}`;
            }

            if (options.detailed) {
                head = ['ID', 'Issued At', 'Effective At', 'Expires At', 'Issuer'];
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

                data.push([
                    peer.id,
                    moment(claims.iat * 1000).toISOString(),
                    effective_at,
                    expires_at,
                    host
                ]);
            } else {
                data.push([
                    peer.id,
                    host
                ]);
            }
        }

        const table = new Table({head, style: { head:['green'] }});

        table.push(...data);
        console.log('');
        console.log(` ${c.bold.underline('Registered Peers')}`);
        console.log(c.italic(` Use 'coattail peer show --id <id>' for more information on a peer.`));
        console.log('');
        console.log(table.toString());
        console.log('');
    });
};