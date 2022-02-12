const { queue } = require(`../../../../action-queue`);

const Operation = require(`../../../operation`);
const Events = require(`../../../../events`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Operation.TYPE.TERMINAL,
            Operation.DIRECTION.HOST_TO_CLIENT,
            {
                opCode,
                chain,
                data
            }
        );
    }

    //@on-client
    async handle(client) { /* NO-OP */ }
};