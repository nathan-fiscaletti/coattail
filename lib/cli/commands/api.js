const api = require(`../../api`);
const config = require(`../../config`);
const { _createCommand } = require(`../`);

module.exports = {
    description: 'All actions pertaining to the API server.',
    actions: { 
        start: {
            description: 'Starts the API server.',
            flags: {}
        },
    },

    start: (flags) => { 
        const conf = config.load();
        api.serve(conf);
    }
}

