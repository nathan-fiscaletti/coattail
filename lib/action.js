const SchemaManager = require(`./schema-manager`);
const SubscriptionToken = require(`./tokens/subscription-token`);
const Peer = require(`./peer`);
const Client = require(`./client`);
const Operations = require(`./protocol`);
const log = require(`./log`);

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

    performWithInputValidation(input, publish=false) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.validateInput(input).then(validationRes => {
                if (!validationRes.valid) {
                    reject(validationRes.errors);
                    return;
                }

                self.perform(input).then(output => {
                    if (publish) {
                        self.publishWithOutputValidation(output).then(() => {
                            resolve(output);
                        }).catch(reject);
                    } else {
                        resolve(output);
                    }
                }).catch(err => {
                    reject([err]);
                });
            });
        });
    }

    publishWithOutputValidation(output) {
        return new Promise((resolve, reject) => {
            this.validateOutput(output).then(validationRes => {
                if(!validationRes.valid) {
                    reject(validationRes.errors);
                    return;
                }

                SubscriptionToken.loadAllMatching({
                    matches: token => token.claims().subscribedTo.includes(this.name)
                }).then(async subscriptionTokens => {
                    const errors = [];
                    for (const subscriptionToken of subscriptionTokens) {
                        try {
                            await new Promise((resolve, reject) => {
                                const peer = new Peer({jwt: subscriptionToken.jwt, isLocal: false});
                                const connection = Client.connect(peer, log('').silent());

                                connection.on('error', error => {
                                    connection.disconnect();
                                    reject(error);
                                });

                                connection.on('ready', () => {
                                    Operations.get(`notify`, {
                                        subscription_token_id: subscriptionToken.token_id,
                                        data: output
                                    }).send(connection, () => {
                                        connection.disconnect();
                                        resolve();
                                    }).catch(err => errors.push(err));
                                });
                            });
                        } catch (err) {
                            errors.push(err);
                        }
                    }

                    if (errors.length > 0) {
                        reject(errors);
                    } else {
                        resolve();
                    }
                }, err => reject([err]));
            })
        });
    }
}

module.exports = Action;