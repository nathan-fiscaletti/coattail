const SchemaManager = require(`./schema-manager`);
const { connect } = require(`./data/connection`);

class Action {
    constructor({inputSchema, outputSchema}) {
        this.inputSchema = inputSchema;
        this.outputSchema = outputSchema;
        this.name = undefined;
    }

    async perform(input) {
        throw new Error(`Action subclass '${this.name || this.constructor.name}' must implement the abstract method 'perform(input)'`);
    }

    async validateInput(data) {
        const sm = new SchemaManager();
        const schema = sm.load(this.inputSchema) || this.inputSchema;
        return await sm.validateSchema(schema, data);
    }

    async validateOutput(data) {
        const sm = new SchemaManager();
        const schema = sm.load(this.outputSchema) || this.outputSchema;
        return await sm.validateSchema(schema, data);
    }

    performWithInputValidation(input, notifySubscribers=false) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.validateInput(input).then(validationRes => {
                if (!validationRes.valid) {
                    reject(validationRes.errors);
                    return;
                }

                self.perform(input).then(output => {
                    if (notifySubscribers) {
                        const connection = connect();
                        self.publishWithValidation(connection, output).then(() => {
                            resolve(output);
                        }).catch(reject).finally(() => connection.destroy());
                        return;
                    }
                    resolve(output);
                }).catch(err => reject([err]));
            });
        });
    }

    publishWithOutputValidation(connection, output) {
        return new Promise((resolve, reject) => {
            this.validateOutput(output).then(validationRes => {
                if(!validationRes.valid) {
                    reject(validationRes.errors);
                    return;
                }

                connection('qued_actions').insert({
                    name: this.name, output
                }).then(resolve).catch(err => reject([err]));
            })
        });
    }
}

module.exports = Action;