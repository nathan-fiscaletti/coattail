const tableName = 'coattail_peers';

exports.up = function(knex) {
    return knex.schema.createTable(tableName, function(table) {
        table.string('id').unique({indexName: 'peer_unique_id'});
        table.string('token');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable(tableName);
};
