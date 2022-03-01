const ActionManager = require(`./action-manager`);
const Model = require(`./data/model`);
const tables = require(`./data/tables`);
const Token = require(`./tokens/token`);
const Operations = require(`./protocol`);
const Client = require("./client");
const log = require(`./log`);
const config = require(`./config`);

class Peer extends Model {
    static table = tables.PEERS;
    static ignoreColumns = ['_isLocal', 'token', 'connection'];

    static local() {
        return new Peer({jwt: '', id: config.get().paths.root, isLocal: true});
    }

    static async load({database, id}) {
        if (id === Peer.local().id) {
            return Peer.local();
        }

        return await super.load({database, id});
    }

    constructor({jwt, id, isLocal}) {
        super({jwt, id});
        this._isLocal = !!isLocal;
        this.token = new Token({jwt});
    }

    bearerKey() {
        return `ipv4://${this.token.claims().host}/32`;
    }

    performAction({name, data, publish, verbose}={}) {
        return new Promise(async (resolve, reject) => {
            if (this.isLocal()) {
                // Perform on Local Peer
                const am = new ActionManager();
                am.load(name).then(action => {
                    action.performWithInputValidation(data, publish)
                          .then(resolve, reject);
                }).catch(err => reject([err]));
            } else {
                // Perform on remote Peer
                let logger = log('Client');
                if (!verbose) {
                    logger = logger.silent();
                }
                const connection = Client.connect(this, logger);
                connection.on('error', error => {
                    connection.disconnect();
                    reject([error]);
                });

                connection.on('ready', () => {
                    Operations.get(`actions.perform`, {
                        action: name,
                        data,
                        publish
                    }).terminate(connection, data => {
                        const {errors, data: response} = data;
            
                        if (errors.length !== 0) {
                            reject(errors);
                        } else {
                            resolve(response);
                        }
                    }).catch(err => {
                        reject([err]);
                    }).finally(() => {
                        connection.disconnect();
                    });
                });
            }
        });
    }

    publishActionResonse({name, data, verbose}={}) {
        return new Promise((resolve, reject) => {
            if (this.isLocal()) {
                const am = new ActionManager();
                am.load(name).then(action => {
                    action.publishWithOutputValidation(data)
                          .then(resolve, reject);
                }).catch(err => reject([err]));
            } else {
                let logger = log('Client');
                if (!verbose) {
                    logger = logger.silent();
                }
                const connection = Client.connect(this, logger);
                connection.on('error', error => {
                    connection.disconnect();
                    reject([error]);
                });

                connection.on('ready', () => {
                    Operations.get(`actions.publish`, {
                        action: name,
                        data
                    }).terminate(connection, data => {
                        const {errors} = data;
                        if (errors.length > 0) {
                            reject(errors);
                        } else {
                            resolve();
                        }
                    }).catch(err => {
                        reject([err]);
                    }).finally(() => {
                        connection.disconnect();
                    });;
                });
            }
        });
    }

    subscribeTo({receiver, action, verbose}) {
        return new Promise((resolve, reject) => {
            if (this.isLocal()) {
                reject(new Error('Cannot subscribe to events on local Peer.'));
            } else {
                // Perform on remote Peer
                let logger = log('Client');
                if (!verbose) {
                    logger = logger.silent();
                }
                const connection = Client.connect(this, logger);
                connection.on('error', error => {
                    connection.disconnect();
                    reject(error);
                });

                connection.on('ready', async () => {
                    Operations.get('actions.subscribe', {
                        action, receiver
                    }).terminate(connection, async data => {
                        connection.disconnect();

                        const { error, subscriberTokenId, publisherTokenId } = data;
                        if (error !== null) {
                            reject(error);
                        } else {
                            let token;
                            try {
                                token = await Token.load({id: subscriberTokenId});
                            } catch (error) {
                                reject(error);
                                return;
                            }

                            resolve({token, peerId: publisherTokenId});
                        }
                    }).catch(err => {
                        reject([err]);
                    }).finally(() => {
                        connection.disconnect();
                    });
                });
            }
        });
    }

    isLocal() {
        return this.id === Peer.local().id && this._isLocal;
    }
}

module.exports = Peer;