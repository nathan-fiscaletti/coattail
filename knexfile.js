const configuration = require(`./lib/config`).load();

module.exports = {
    ...configuration.data,
    migrations: {
        directory: "./lib/data/migrations",
        tableName: 'knex_migrations'
    }
};