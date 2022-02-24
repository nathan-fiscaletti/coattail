const knex = require(`knex`);
const config = require(`../config`);

function db() {
    return knex({
        ...config.get().data,
        useNullAsDefault: true
    });
}

module.exports = { db };