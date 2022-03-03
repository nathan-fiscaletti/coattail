const Peer = require("../../../../peer");
const Operation = require(`../../../operation`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Operation.TYPE.INITIAL,
            Operation.DIRECTION.CLIENT_TO_HOST,
            {
                opCode,
                chain,
                data
            }
        );
    }

    //@on-host
    async handle(session) {
        const local = Peer.local();
        local.getActions().then(actions => {
            this.chain.op('actions.list.response', {
                actions,
                error: null
            }).send(session);
        }).catch(err => {
            this.chain.op('actions.list.response', {
                actions: null,
                error: err
            }).send(session);
        })
    }
};