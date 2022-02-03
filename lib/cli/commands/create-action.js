const templates = require(`../../templates`);
const path = require(`path`);

module.exports = async (name) => {
    const destination = path.join(__dirname, '..', '..', '..', 'actions', `${name}.js`);
    try {
        templates.create('action', destination);
        console.log(`Created new action ${destination}`);
    } catch (error) {
        console.log('Failed to create action:');
        console.log(error);
    }
}