const tableName = 'coattail_subscriptions';

exports.up = function(knex) {
    return knex.schema.createTable(tableName, function(table) {
        table.string('id').unique({indexName: 'subscription_token_unique_id'});
        table.string('jwt');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable(tableName);
};