const knex = require(`knex`);

function connect(config) {
    return knex({
        client: 'mysql',
        connection: config.database
    });
}

module.exports = {
    connect
};