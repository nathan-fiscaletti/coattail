// const operations = require(`./lib/protocol`);
// console.log(operations.client.auth_failure);

const log = require(`./lib/log`);
const logger = log(`Client`);

const config = require(`./lib/client/config`).load();
const Client = require(`./lib/client/client`);
const serverOperations = require(`./lib/protocol-loader`)('server');

const client = Client.connect(config, logger);

client.on('authenticated', () => {
    serverOperations.get('actions.perform').send(client, 'example', {});
});