const path = require(`path`);
const fs = require(`fs`);

async function perform(name, data, connection, completed) {
    const actionPath = path.join(__dirname, '..', 'actions', `${name}`);
    if (!fs.existsSync(`${actionPath}.js`)) {
        throw new Error(`Action '${name}' does not exist.`);
    }

    const action = require(`.${path.sep}${path.join('..', 'actions', name)}`);
    const res = await action.publish(data);
    console.log(`action ${name} performed, queuing for subscribers`);
    await queue(name, res, connection, completed);
}

async function queue(name, data, connection, completed) {
    await connection('qued_actions').insert({
        name, data
    }).then(() => {
        console.log(`action queued for subscribers`);
        if (completed !== undefined) {
            completed();
        }
    });
}

module.exports = { perform, queue };