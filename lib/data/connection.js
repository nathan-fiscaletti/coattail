const knex = require(`knex`);
const path = require(`path`);

let _dataConnection;

function connect() {
    if (_dataConnection === undefined) {
        const config = require(`./config`);
        const configuration = config.load();
    
        _dataConnection = knex({
            ...configuration,
            useNullAsDefault: true
        });
    }

    return _dataConnection;
}

module.exports = { connect, tables: require(`./tables`) };