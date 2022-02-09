// const operations = require(`./lib/protocol`);
// console.log(operations.client.auth_failure);

const log = require(`./lib/log`);

const config = require(`./lib/client/config`).load();
const Client = require(`./lib/client/client`);
const Operations = require(`./lib/protocol/protocol-loader`);

const client = Client.connect(config);

client.on('ready', () => {
    client.logger.info('client ready');
    Operations.get('actions.perform', {
        action: 'example',
        data: {age: 26}
    }).terminate(client, (action_yield) => {
        Operations.get('actions.queue', {
            ...action_yield
        }).terminate(client, (response) => {
            console.log(response);
            client.disconnect();
        });
    });
});