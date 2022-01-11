// const operations = require(`./lib/protocol`);
// console.log(operations.client.auth_failure);

const config = require(`./lib/client/config`).load();
const Client = require(`./lib/client/client`);

const client = Client.connect(config);

// const operations = require(`./lib/protocol-loader`)('client');
// console.log(operations);