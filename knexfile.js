const configuration = require(`./lib/data/config`).load();

module.exports = {
    ...configuration,
    migrations: {
        directory: "./lib/data/migrations",
        tableName: 'knex_migrations'
    }
};