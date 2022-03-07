const SchemaManager = require(`./schema-manager`);

class Receiver {
    constructor({inputSchema}) {
        this.inputSchema = inputSchema;
        this.name = undefined;
    }

    async onReceived(input) {
        throw new Error(`Receiver subclass '${this.name || this.constructor.name}' must implement the abstract method 'onReceived(input)'`);
    }

    async validateInput(data) {
        const sm = new SchemaManager();
        const schema = sm.load(this.inputSchema) || this.inputSchema;
        return await sm.validateSchema(schema, data);
    }

    performWithInputValidation(input) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.validateInput(input).then(async validationRes => {
                if (!validationRes.valid) {
                    reject(new AggregateError(validationRes.errors, 'Input data failed schema validation.'));
                    return;
                }
                
                try {
                    await self.onReceived(input);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        });
    }
}

module.exports = Receiver;