const path = require(`path`);
const { pick } = require(`lodash`);
const ModuleManager = require(`./module-manager`);
const Validator = require('jsonschema').Validator;

class SchemaManager extends ModuleManager{
    constructor() {
        super(path.join(__dirname, '..', 'schemas'), '.json');
    }

    allSchemas() {
        return this.allModules().map(
            module => require(path.relative(__dirname, module.absolutePath)
        ));
    }

    load(name) {
        const [ schema ] = this.allSchemas().filter(s => s.id === name);
        return schema;
    }

    validator() {
        const validator = new Validator();

        const schemas = this.allSchemas();
        for(const schema of schemas) {
            validator.addSchema(schema);
        }

        return validator;
    }

    async validateSchema(schema, obj) {
        const res = this.validator().validate(obj, schema, {
            required: true
        });
        return pick(res, ['errors', 'valid']);
    }
}

module.exports = SchemaManager;