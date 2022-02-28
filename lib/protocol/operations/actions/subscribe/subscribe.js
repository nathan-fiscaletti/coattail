const ValidationToken = require(`../../../../tokens/validation-token`);
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
        try {
            // Generate a validation token on the host.
            const token = await ValidationToken.issue();

            // Request a subscription token from the client using
            // the validation token.
            const {action, receiver} = this.data;
            this.chain.op('actions.subscribe.get-st', {
                validationToken: token.jwt,
                action,
                receiver
            }).send(session);
        } catch (err) {
            this.chain.op('actions.subscribe.response', {
                error: `Publisher failed to issue validation token: ${err}`
            }).send(session);
        }
    }
};