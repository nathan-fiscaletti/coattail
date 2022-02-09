const Operation = require(`../operation`);
const Sequence = require(`../sequence`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Sequence.TYPE.FIRE_AND_FORGET,
            Operation.DIRECTION.CLIENT_TO_HOST,
            {
                opCode,
                chain,
                data
            }
        );
    }

    //@on-server
    async handle(session) {
        session.lastKeepAliveAt = Date.now()
    }
};