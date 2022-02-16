const fs = require(`fs`);
const path = require(`path`);
const yaml = require(`js-yaml`);

module.exports = {
    load: () => {
        const location = path.join(__dirname, '..', 'config.yml');
        const contents = fs.readFileSync(location, 'utf8');
        return yaml.load(contents);
    }
};