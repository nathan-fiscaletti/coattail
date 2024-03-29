const Subscription = require(`./subscription`);
const Token = require(`./tokens/token`);
const Peer = require(`./peer`);
const Client = require(`./client`);
const Operations = require(`./protocol`);
const log = require(`./log`);
const os = require(`os`);

class Action {
    constructor() {
        this.name = undefined;
    }

    async perform(input) {
        throw new Error(`Action subclass '${this.name || this.constructor.name}' must implement the abstract method 'perform(input)'`);
    }

    performWithInputValidation(input, publish=false) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.perform(input).then(output => {
                if (publish) {
                    self.publishWithOutputValidation(output).then(() => {
                        resolve(output);
                    }).catch(reject);
                    return;
                } else {
                    resolve(output);
                }
            }).catch(reject);
        });
    }

    publishWithOutputValidation(output) {
        return new Promise((resolve, reject) => {
            Subscription.loadAllMatching({
                matches: subscription => new Token({jwt: subscription.jwt}).subscribedTo().includes(this.name)
            }).then(async subscriptions => {
                const promises = [];
                for (const subscription of subscriptions) {
                    promises.push(new Promise((res, rej) => {
                        const peer = new Peer({jwt: subscription.jwt, isLocal: false});
                        const connection = Client.connect(peer, 5000, log('').silent());

                        connection.on('error', function(error) {
                            connection.disconnect();
                            rej({subscription, error});
                        });

                        connection.on('ready', () => {
                            Operations.get(`notify`, {
                                data: output
                            }).send(connection, () => {
                                connection.disconnect();
                                res();
                            }).catch(function(error) { rej({subscription, error}); });
                        });
                    }));
                }

                const errors = {};
                const results = await Promise.allSettled(promises);
                for (const result of results) {
                    if (result.status === "rejected") {
                        if (!errors[result.reason.subscription.id]) {
                            errors[result.reason.subscription.id] = [];
                        }

                        errors[result.reason.subscription.id].push(result.reason.error);
                    }
                }

                if (Object.keys(errors).length > 0) {
                    const err = new Error(`Failed to notify some subscribers.`);
                    err.stack += `${os.EOL}${os.EOL}Errors:${os.EOL}`;

                    for (const subId of Object.keys(errors)) {
                        err.stack += `${os.EOL}(Subscription ${subId}):${os.EOL}`;
                        const errnum = 1;
                        for (const e of errors[subId]) {
                            err.stack += `${os.EOL}  ${errnum}: ${e.stack.split(os.EOL).map((l, idx) => idx === 0 ? l : `     ${l}`).join(os.EOL)}`;
                        }
                    }

                    reject(err);
                } else {
                    resolve();
                }
            }, reject);
        });
    }
}

module.exports = Action;