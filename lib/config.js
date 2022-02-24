const fs = require(`fs`);
const path = require(`path`);
const yaml = require(`js-yaml`);
const paths = require(`./paths`);

let config;
module.exports = {
    load: function (location = path.join(paths.ROOT, 'config.yml')) {
        const contents = fs.readFileSync(location, 'utf8');
        const res = yaml.load(contents);

        // Parse relative paths.
        if (res.data.connection.filename) {
            res.data.connection.filename = path.join(paths.ROOT, res.data.connection.filename);
        }
        if (res.authentication.public_key.type === 'file') {
            res.authentication.public_key.value = path.join(paths.ROOT, res.authentication.public_key.value);
        }
        if (res.authentication.private_key.type === 'file') {
            res.authentication.private_key.value = path.join(paths.ROOT, res.authentication.private_key.value);
        }
        res.data.migrations.directory = path.join(paths.ROOT, res.data.migrations.directory);

        config = res;
    },
    get: function () {
        if (!config) {
            throw new Error('Config has not been loaded yet. Use config.load().');
        }

        return config;
    }
};