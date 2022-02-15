const tableName = 'coattail_issued_tokens';

exports.up = function(knex) {
    return knex.schema.createTable(tableName, function(table) {
        table.string('id').unique({indexName: 'issued_token_unique_id'});
        table.string('jwt');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable(tableName);
};
