const ActionManager = require(`./action-manager`);
const Model = require(`./data/model`);
const tables = require(`./data/tables`);
const Token = require("./token");

const LOCAL_PEER_ID = 'LOCAL_PEER';

class Peer extends Model {
    static table = tables.PEERS;
    static ignoreColumns = ['isLocal', 'token'];

    static local() {
        return new Peer({jwt: '', id: LOCAL_PEER_ID, isLocal: true});
    }

    static async load({database, id}) {
        if (id === LOCAL_PEER_ID) {
            return Peer.local();
        }

        return super.load({database, id});
    }

    constructor({jwt, id, isLocal}) {
        super({jwt, id});
        this.isLocal = !!isLocal;
        this.token = new Token({jwt});
    }

    performAction(name, data, notifySubscribers) {
        return new Promise((resolve, reject) => {
            const am = new ActionManager();
            am.load(name).then(action => {
                action.performWithInputValidation(data, notifySubscribers).then(resolve, reject);
            }).catch(err => reject([err]));
        });
    }

    isLocal() {
        return this.id === LOCAL_PEER_ID && this.isLocal;
    }
}

module.exports = Peer;