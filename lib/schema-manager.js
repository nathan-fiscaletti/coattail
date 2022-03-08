const path = require(`path`);
const { pick } = require(`lodash`);
const ModuleManager = require(`./module-manager`);
const Validator = require('jsonschema').Validator;
const config = require(`./config`);
const SchemaCompiler = require(`./schema-compiler`);

class SchemaManager extends ModuleManager{
    constructor() {
        super(config.get().paths.schemas, '.json');
    }

    allSchemas() {
        return this.allModules().map(
            module => require(path.relative(__dirname, module.absolutePath))
        );
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

    compile(schema) {
        const sc = new SchemaCompiler(schema);

        const schemas = this.allSchemas();
        for(const schema of schemas) {
            sc.addSchema(schema);
        }

        const { compiled, warnings } = sc.compile()
        if (warnings.length > 0) {
            const [ error ] = warnings;
            throw error;
        }

        return compiled;
    }

    async validateSchema(schema, obj) {
        const res = this.validator().validate(obj, schema, {
            required: true
        });
        return pick(res, ['errors', 'valid']);
    }
}

module.exports = SchemaManager;