const fs = require(`fs`);
const path = require(`path`);
const yaml = require(`js-yaml`);

let config;
module.exports = {
    load: function (location = './') {
        const contents = fs.readFileSync(path.join(location, 'config.yml'), 'utf8');
        const res = yaml.load(contents);
        config = res;
    },
    get: function () {
        if (!config) {
            throw new Error('Config has not been loaded yet. Use config.load().');
        }

        return config;
    }
};