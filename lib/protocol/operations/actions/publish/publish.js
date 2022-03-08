const Operation = require(`../../../operation`);
const Peer = require(`../../../../peer`);

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

        session.logger.info(`publish action result for '${action}'`);

        const local = Peer.local();
        local.publishActionResonse({name: action, data}).then(res => {
            session.logger.info(`published action result for '${action}' successfully`);
            this.chain.op('actions.publish.response', {
                error: null    
            }).send(session).catch(_ => { /* discarded */ });
        }).catch(err => {
            const error = (Object.entries(err).length > 0) ? err : (err.stack || err.message || `${err}`);
            session.logger.info(`failed to publish action result for '${action}': ${error}`);
            this.chain.op('actions.publish.response', {
                error
            }).send(session).catch(_ => { /* discarded */ });
        });
    }
};