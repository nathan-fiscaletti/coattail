const Peer = require("../../../../peer");

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
        const {action, data, publish} = this.data;

        session.logger.info(`performing action '${action}'`);

        const local = Peer.local();
        local.performAction({name: action, data, publish}).then(res => {
            session.logger.info(`performed action '${action}' successfully`);
            this.chain.op('actions.perform.response', {
                error: null,
                action,
                data: res
            }).send(session).catch(_ => { /* discarded */ });
        }).catch(error => {
            session.logger.info(`failed to perform action '${action}': ${error}`);
            this.chain.op('actions.perform.response', {
                error,
                action,
                data: null
            }).send(session).catch(_ => { /* discarded */ });
        });
    }
};