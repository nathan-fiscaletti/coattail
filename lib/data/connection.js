const knex = require(`knex`);

function db() {
    const config = require(`../config`).load();
    return knex({
        ...config.data,
        useNullAsDefault: true
    });
}

module.exports = { db };