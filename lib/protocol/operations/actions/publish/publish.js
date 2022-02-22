const { queue } = require(`../../../../action-queue`);

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
        const {action, data} = this.data;

        await queue(action, data, session.server.database).then(
            _ => {
                this.chain.op('actions.publish.response', {
                    error: null, action, data
                }).send(session);
            },
            error => {
                this.chain.op('actions.publish.response', {
                    error, action, data
                }).send(session);
            }
        )
    }
};