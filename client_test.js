const { connect } = require(`./lib/data/connection`);

const Peer = require(`./lib/peer`);
const connection = connect();
Peer.loadAll(connection).then(peers => {
    console.log(peers);
    connection.destroy();
});

// const jwt = require(`jsonwebtoken`);

// const decoded = jwt.decode("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJwZXJmb3JtYWJsZSI6WyJ0ZXN0Il19.rU2LUsOBSpTCPvqVAHkZsTrLHk-qaiGDEJg_HuiabgA");
// console.log(decoded);

// const config = require(`./lib/client/config`).load();
// const Client = require(`./lib/client/client`);
// const Operations = require(`./lib/protocol`);

// const client = Client.connect(config);
// client.logPackets = true;

// client.on('ready', () => {
//     client.logger.info('client ready');
    
//     Operations.get('actions.perform', {
//         action: 'example',
//         data: {age: 26}
//     }).terminate(client, (action_yield) => {
//         Operations.get('actions.queue', {
//             ...action_yield
//         }).terminate(client, (response) => {
//             console.log(response);
//             client.disconnect();
//         });
//     });
// });