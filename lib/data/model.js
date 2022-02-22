const { v4: uuid } = require('uuid');
const { db } = require(`./connection`);
const { omit } = require(`lodash`);

async function dbOperation(database, table, operation) {
    let conn = database;
    let closeDatabase = false
    if (database === undefined) {
        conn = db();
        closeDatabase = true;
    }

    let res, error;
    try {
        res = await operation(conn(table));
    } catch (err) {
        error = err;
    }

    if (closeDatabase) {
        conn.destroy();
    }

    if (error) {
        throw error;
    }

    return res;
}

class Model {
    static idColumn = 'id';
    static table;
    static ignoreColumns = [];

    constructor(props) {
        Object.assign(this, props);
    }

    async save({database, newId}={}) {
        const idColumn = this.constructor.idColumn;
        const ignoreColumns = this.constructor.ignoreColumns;
        const id = this[idColumn];
        const data = this;

        newId = await dbOperation(database, this.constructor.table, async (table) => {
            if (id === undefined) {
                data[idColumn] = newId || uuid();
                await table.insert(omit(data, ignoreColumns));
                return data[idColumn];
            } else {
                await table.where(idColumn, id)
                        .update(omit(data, [ idColumn, ...ignoreColumns ]));
                return id;
            }
        });

        this[idColumn] = newId;
    }

    async delete({database}={}) {
        const idColumn = this.constructor.idColumn;
        const id = this[idColumn];

        await dbOperation(database, this.constructor.table, async (table) => {
            await table.where(idColumn, id).del();
        });
    }

    static async load({database, id}={}) {
        const cls = this;
        const idColumn = this.idColumn;

        return await dbOperation(database, this.table, async (table) => {
            const [ row ] = await table.where(idColumn, id).limit(1);
            if (row === undefined) {
                return undefined;
            }

            return new cls(row);
        });
    }

    static async loadAll({database}={}) {
        const cls = this;
        return await dbOperation(database, this.table, async (table) => {
            return (await table).map(
                row => row ? new cls(row) : undefined
            );
        });
    }
}

module.exports = Model;