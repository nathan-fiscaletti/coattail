const { v4: uuid } = require('uuid');
const ActionManager = require(`./action-manager`);
const Token = require(`./token`);
const LOCAL_PEER_ID = 'LOCAL_PEER';

class Peer {
    static async loadAll(connection) {
        return (await connection('coattail_peers')).map(
            row => row ? new Peer({id: row.id, jwt: row.token}) : undefined
        );
    }

    static local() {
        return new Peer({jwt: '', id: LOCAL_PEER_ID, isLocal: true});
    }

    static async load(connection, id) {
        if (id === LOCAL_PEER_ID) {
            return Peer.local();
        }

        const [ row ] = await connection(
            'coattail_peers'
        ).where('id', id);
        if (row) {
            return new Peer({jwt: row.token, id: row.id});
        } else {
            return undefined;
        }
    }

    constructor({jwt, id, isLocal}) {
        this.token = new Token({jwt})
        this.id = id || uuid();
        this.isLocal = !!isLocal;
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