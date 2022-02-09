const Operation = require("../../operation");
const Sequence = require(`../../sequence`);

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
        client._notifyAuthenticated(this.data);
    }
};