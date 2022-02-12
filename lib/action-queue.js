const path = require(`path`);
const fs = require(`fs`);

async function perform(name, data) {
    const actionPath = path.join(__dirname, '..', 'actions', `${name}`);
    if (!fs.existsSync(`${actionPath}.js`)) {
        throw new Error(`Action '${name}' does not exist.`);
    }

    const action = require(`.${path.sep}${path.join('..', 'actions', name)}`);
    const res = await action.publish(data);
    return res;
}

async function notify(name, data, connection) {
    
}



module.exports = { perform, notify };