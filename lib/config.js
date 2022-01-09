const fs = require(`fs`);
const path = require(`path`);
const yaml = require(`js-yaml`);
const { getEnvironmentName } = require(`./environment`);

module.exports = {
    load: (env = 'development') => {
        env = getEnvironmentName(env);

        const location = path.join(__dirname, '../config/', `${env}.yaml`);
        const contents = fs.readFileSync(location, 'utf8');
        return yaml.load(contents);
    }
};