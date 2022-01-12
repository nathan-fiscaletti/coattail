const knex = require(`knex`);
const path = require(`path`);

let _dataConnection;

// anyone can publish, anyone can subscribe.
// 

function tryConnect() {
    if (_dataConnection !== undefined) {
        return;
    }

    const config = require(`./config`);
    
    const configuration = config.load();

    _dataConnection = knex({
        ...configuration,
        useNullAsDefault: true
    });
}

function queueAction(name, data) {
    tryConnect();

    return _dataConnection('qued_actions').insert({
        name,
        data: JSON.stringify(data)
    });
}

module.exports = { queueAction };