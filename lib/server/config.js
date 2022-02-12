const fs = require(`fs`);
const path = require(`path`);
const yaml = require(`js-yaml`);

module.exports = {
    load: (cfg) => {
        const location = cfg === undefined ? path.join(__dirname, '..', '..', 'config', 'server.yml') : cfg;
        const contents = fs.readFileSync(location, 'utf8');
        return yaml.load(contents);
    }
};