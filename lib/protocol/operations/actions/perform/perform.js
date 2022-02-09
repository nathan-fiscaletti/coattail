const { perform } = require(`../../../../action-queue`);

const Sequence = require(`../../../sequence`);
const Operation = require(`../../../operation`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Sequence.TYPE.INITIAL,
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
        const {action, data} = this.data;

        await perform(action, data, session.server.connection).then(
            res => {
                this.chain.op('actions.perform.response', {
                    error: null, action, data: res
                }).send(session);
            },
            error => {
                this.chain.op('actions.perform.response', {
                    error, action, data: null
                }).send(session); 
            }
        );
    }
};