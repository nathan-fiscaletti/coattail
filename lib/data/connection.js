const knex = require(`knex`);

function db() {
    const config = require(`./config`);
    const configuration = config.load();
    return knex({
        ...configuration,
        useNullAsDefault: true
    });
}

module.exports = { db };