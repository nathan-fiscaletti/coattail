const tableName = 'qued_actions';

exports.up = function(knex) {
    return knex.schema.createTable(tableName, function(table) {
        table.increments();
        table.string('name');
        table.text('data', 'longtext');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable(tableName);
};
