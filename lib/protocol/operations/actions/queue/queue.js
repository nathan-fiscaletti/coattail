const { queue } = require(`../../../../action-queue`);

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

        await queue(action, data, session.server.connection).then(
            _ => {
                this.chain.op('actions.queue.response', {
                    error: null, action, data
                }).send(session);
            },
            error => {
                this.chain.op('actions.queue.response', {
                    error, action, data
                }).send(session);
            }
        )
    }
};