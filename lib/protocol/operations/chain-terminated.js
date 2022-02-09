const Operation = require(`../operation`);
const Sequence = require(`../sequence`);
const Events = require(`../../events`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Sequence.TYPE.FIRE_AND_FORGET,
            Operation.DIRECTION.BI_DIRECTIONAL,
            {
                opCode,
                chain,
                data
            }
        );
    }

    //@on-either
    async handle(_) {
        Events.emit(this.data.chain._terminatedEvent(), this.data.results);
        Events.removeAllListeners(this.data.chain._terminatedEvent());
    }
};