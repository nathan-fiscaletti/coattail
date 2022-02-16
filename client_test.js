const Client = require(`./lib/client`);
const Peer = require(`./lib/peer`);
const Operations = require(`./lib/protocol`);
const { db } = require(`./lib/data/connection`);

const database = db();
Peer.load({id: '9027e199-79d4-4857-a300-be3790c0e35b'}).then(peer => {
    database.destroy();

    const client = Client.connect(peer);
    client.on('ready', () => {
        client.logger.info('client ready');
        client.disconnect();
    });
});