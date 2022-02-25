const ActionManager = require(`./action-manager`);
const Model = require(`./data/model`);
const tables = require(`./data/tables`);
const Token = require(`./tokens/token`);
const SubscriptionToken = require(`./tokens/subscription-token`);
const Operations = require(`./protocol`);
const Client = require("./client");
const log = require(`./log`);

const LOCAL_PEER_ID = 'LOCAL_PEER';

class Peer extends Model {
    static table = tables.PEERS;
    static ignoreColumns = ['_isLocal', 'token', 'connection'];

    static local() {
        return new Peer({jwt: '', id: LOCAL_PEER_ID, isLocal: true});
    }

    static async load({database, id}) {
        if (id === LOCAL_PEER_ID) {
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

    performAction({name, data, publish}={}) {
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
                const connection = Client.connect(this, log('').silent());
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
                        connection.disconnect();

                        const {errors, data: response} = data;
            
                        if (errors.length !== 0) {
                            reject(errors);
                        } else {
                            resolve(response);
                        }
                    });
                });
            }
        });
    }

    publishActionResonse({name, data}={}) {
        return new Promise((resolve, reject) => {
            if (this.isLocal()) {
                const am = new ActionManager();
                am.load(name).then(action => {
                    action.publishWithOutputValidation(data)
                          .then(resolve, reject);
                }).catch(err => reject([err]));
            } else {
                const connection = Client.connect(this, log('').silent());
                connection.on('error', error => {
                    connection.disconnect();
                    reject([error]);
                });

                connection.on('ready', () => {
                    Operations.get(`actions.publish`, {
                        action: name,
                        data
                    }).terminate(connection, data => {
                        connection.disconnect();

                        const {errors} = data;
                        if (errors.length > 0) {
                            reject(errors);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        });
    }

    subscribeTo(receiver, action) {
        return new Promise((resolve, reject) => {
            if (this.isLocal()) {
                reject(new Error('Cannot subscribe to events on local Peer.'));
            } else {
                // Perform on remote Peer
                const connection = Client.connect(this, log('').silent());
                connection.on('error', error => {
                    connection.disconnect();
                    reject(error);
                    return;
                });

                connection.on('ready', async () => {
                    const token = await SubscriptionToken.issue({
                        receiver,
                        validBearers: [this.bearerKey()],
                        // TODO: Support multiple actions
                        subscribedTo: [action]
                    });

                    Operations.get('actions.subscribe', {
                        token: token.jwt
                    }).terminate(connection, data => {
                        connection.disconnect();

                        const { error, subscription } = data;
                        if (error !== null) {
                            reject(error);
                        } else {
                            resolve(subscription);
                        }
                    });
                });
            }
        });
    }

    isLocal() {
        return this.id === LOCAL_PEER_ID && this._isLocal;
    }
}

module.exports = Peer;