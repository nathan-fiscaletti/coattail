const fs = require(`fs`);
const path = require(`path`);
const yaml = require(`js-yaml`);

module.exports = {
    load: (dir) => {
        const location = path.join(__dirname, '..', '..', 'config', 'database.yml');
        const contents = fs.readFileSync(location, 'utf8');
        const configuration = yaml.load(contents);

        return configuration;
    }
};