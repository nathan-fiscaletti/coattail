const Client = require(`./lib/client`);
const Peer = require(`./lib/peer`);
const Operations = require(`./lib/protocol`);
const { connect } = require(`./lib/data/connection`);

const connection = connect();
Peer.load(connection, '89476422-4f6f-4b8d-8cbf-35d0b9893b0f').then(peer => {
    connection.destroy();

    const client = Client.connect(peer);
    client.on('ready', () => {
        client.logger.info('client ready');
        client.disconnect();
    });
});