const tableName = 'coattail_validation_tokens';

exports.up = function(knex) {
    return knex.schema.createTable(tableName, function(table) {
        table.string('id').unique({indexName: 'validation_token_unique_id'});
        table.string('jwt');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable(tableName);
};
