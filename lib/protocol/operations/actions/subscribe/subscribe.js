const ValidationToken = require(`../../../../tokens/validation-token`);
const Operation = require(`../../../operation`);
const ActionManager = require(`../../../../action-manager`);

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
            // Request a subscription token from the client using
            // the validation token.
            const {action, receiver} = this.data;

            // Validate that this session is allowed to subscribe to the actions.
            if (!session.token.subscribable().includes('*')) {
                if (!session.token.subscribable().includes(action)) {
                    this.chain.op('actions.subscribe.response', {
                        error: `Not permitted to subscribe to action '${subAction}'`
                    }).send(session).catch(_ => { /* discarded */ });
                    return;
                }
            }

            // Make sure the action is available.
            const am = new ActionManager();
            try {
                await am.load(action);
            } catch (_) {
                this.chain.op('actions.subscribe.response', {
                    error: `Action unavailable.`
                }).send(session);
                return;
            }

            // Generate a validation token on the host.
            const token = await ValidationToken.issue();

            // Start the process of retrieving a subscription token
            // from the client using the validation token as a bearer.
            this.chain.op('actions.subscribe.get-st', {
                authenticationTokenId: session.token.claims().jti,
                validationToken: token.jwt,
                action,
                receiver
            }).send(session);
        } catch (err) {
            const error = (Object.entries(err).length > 0) ? err : (err.stack || err.message || `${err}`);
            this.chain.op('actions.subscribe.response', {
                error
            }).send(session);
        }
    }
};