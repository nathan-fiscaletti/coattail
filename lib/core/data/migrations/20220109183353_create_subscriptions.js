const tableName = 'subscriptions';

exports.up = function(knex) {
    return knex.schema.createTable(tableName, function (table) {
            table.increments('id');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable(tableName);
};
