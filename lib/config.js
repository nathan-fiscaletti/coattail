const fs = require(`fs`);
const path = require(`path`);
const yaml = require(`js-yaml`);

module.exports = {
    load: () => {
        const dir = `${__dirname}/../config`;
        const configs = fs.readdirSync(dir).filter(element => element.endsWith(`.yml`) || element.endsWith(`.yaml`));
        const results = [];

        for(const configFile of configs) {
            const contents = fs.readFileSync(path.join(dir, configFile), 'utf8');
            results[path.parse(configFile).name] = yaml.load(contents);
        }

        return results;
    }
};