const Operation = require(`../../../operation`);

// this operation is here so that the client can ultimately
// respond to the chain it started when the initial subscribe
// operation was called from an operation that failed, but was
// run on the client side.

module.exports = class extends Operation {
    constructor(opCode, chain, data = {}) {
        super(
            Operation.TYPE.CONTINUATION,
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
        this.chain.op('actions.subscribe.response', this.data).send(session);
    }
};