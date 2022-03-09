const ActionManager = require(`./action-manager`);
const Model = require(`./data/model`);
const tables = require(`./data/tables`);
const Token = require(`./tokens/token`);
const Operations = require(`./protocol`);
const Client = require("./client");
const log = require(`./log`);
const config = require(`./config`);
const os = require(`os`);
const ReceiverManager = require("./receiver-manager");

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

    performAction({name, data, publish, verbose, logger}={}) {
        return new Promise(async (resolve, reject) => {
            if (this.isLocal()) {
                // Perform on Local Peer
                const am = new ActionManager();
                am.load(name).then(action => {
                    action.logger = logger ? logger.child(`action-${action.name}`) : log(`action-${action.name}`);
                    action.performWithInputValidation(data, publish)
                          .then(resolve, err => {
                              if (err instanceof AggregateError) {
                                  err.stack += `${os.EOL}${os.EOL}Validation Errors:${os.EOL}`;
                                  const errnum = 1;
                                  for (const e of err.errors) {
                                    err.stack += `${os.EOL}${errnum}: ${e.stack}`;
                                  }
                              }
                              reject(err);
                          });
                }).catch(reject);
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

                connection.on('ready', () => {
                    Operations.get(`actions.perform`, {
                        action: name,
                        data,
                        publish
                    }).terminate(connection, data => {
                        const {error, data: response} = data;
            
                        if (error) {
                            reject(error);
                        } else {
                            resolve(response);
                        }
                    }).catch(reject).finally(() => {
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
                          .then(resolve, err => {
                              if (err instanceof AggregateError) {
                                  err.stack += `${os.EOL}${os.EOL}Validation Errors:${os.EOL}`;
                                  const errnum = 1;
                                  for (const e of err.errors) {
                                      err.stack += `${os.EOL}${errnum}: ${e.stack}`;
                                  }
                              }
                              reject(err);
                          });
                }).catch(reject);
            } else {
                let logger = log('Client');
                if (!verbose) {
                    logger = logger.silent();
                }
                const connection = Client.connect(this, logger);
                connection.on('error', error => {
                    connection.disconnect();
                    reject(error);
                });

                connection.on('ready', () => {
                    Operations.get(`actions.publish`, {
                        action: name,
                        data
                    }).terminate(connection, data => {
                        const {error} = data;
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    }).catch(reject).finally(() => {
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
                    }).catch(reject).finally(() => {
                        connection.disconnect();
                    });
                });
            }
        });
    }

    getActions({verbose}={}) {
        return new Promise((resolve, reject) => {
            if (this.isLocal()) {
                const am = new ActionManager();
                am.loadAll().then(actions => resolve(
                    actions.map(action => {
                        action.subscribable = true;
                        action.publishable = true;
                        action.performable = true;

                        return action;
                    })
                ), reject);
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
                    Operations.get('actions.list').terminate(connection, async data => {
                        const { error, actions } = data;

                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve(actions.map(action => {
                            action.publishable = this.token.publishable().includes(action.name) || this.token.publishable().includes('*');
                            action.performable = this.token.performable().includes(action.name) || this.token.performable().includes('*');
                            action.subscribable = this.token.subscribable().includes(action.name) || this.token.subscribable().includes('*');

                            return action;
                        }));
                    }).catch(reject).finally(() => {
                        connection.disconnect();
                    });
                });
            }
        });
    }

    getReceivers({verbose}={}) {
        return new Promise((resolve, reject) => {
            if (this.isLocal()) {
                const rm = new ReceiverManager();
                rm.loadAll().then(receivers => resolve(receivers), reject);
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
                    Operations.get('receivers.list').terminate(connection, async data => {
                        const { error, receivers } = data;

                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve(receivers);
                    }).catch(reject).finally(() => {
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