const Operation = require(`../../../operation`);

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