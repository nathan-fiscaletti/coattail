const Peer = require(`../../../peer`);
const { connect } = require(`../../../data/connection`);

const commandLineArgs = require('command-line-args');

module.exports = async (cli) => {
    const options = commandLineArgs([
        { name: 'help', alias: 'h', type: Boolean },
        { name: "id", alias: "i" }
    ], { argv: cli.argv, stopAtFirstUnknown: true });

    if (options.help) {
        cli.printHelp([
            {
                header: 'Coattail -- Remove Peer',
                content: 'Remove a registered peer from this Coattail instance.'
            },
            {
                header: 'Usage',
                content: [
                    `$ coattail peer remove [options]`
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
                        description: 'The ID of the peer you wish to remove.'
                    }
                ]
            }
        ]);
        return;
    }

    if (options.id === undefined || typeof options.id !== 'string' || options.id.length === 0) {
        console.error('Error: Invalid peer ID.');
        return;
    }

    const database = connect();
    Peer.loadAll(database).then(peers => {
        if(!peers.some(p => p.id === options.id)) {
            console.error('Error: No peer found with the provided peer ID.');
            database.destroy();
            return;
        }

        database('coattail_peers')
            .where('id', options.id)
            .del()
            .then(() => {
                console.log(`Removed peer ${options.id}`);
            })
            .catch(err => {
                console.error(`Error: Failed to delete peer ${options.id}`);
                console.error(err);
            }).finally(() => {
                database.destroy();
            });
    });
};