const { queue } = require(`../../../../action-queue`);

const Sequence = require(`../../../sequence`);
const Operation = require(`../../../operation`);
const Events = require(`../../../../events`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Sequence.TYPE.TERMINAL,
            Operation.DIRECTION.HOST_TO_CLIENT,
            {
                opCode,
                chain,
                data
            }
        );
    }

    //@on-client
    async handle(client) {
        const {error, action, data} = this.data;
        Events.emit(Events.CLIENT.ACTION_QUEUED, action, data, error);
    }
};