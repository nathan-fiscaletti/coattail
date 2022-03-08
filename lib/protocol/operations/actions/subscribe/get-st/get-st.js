const Operation = require("../../../../operation");
const SubscriptionToken = require(`../../../../../tokens/subscription-token`);
const ValidationToken = require(`../../../../../tokens/validation-token`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Operation.TYPE.CONTINUATION,
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
        try {
            const {validationToken, action, receiver} = this.data;

            // Save the validation token on the client for future
            // requests.
            let vt;
            try {
                vt = new ValidationToken({jwt: validationToken})
                await vt.save();
            } catch (_) {
                this.chain.op(`actions.subscribe.response`, {
                    error: `Failed to save validation token on subscriber.`
                }).send(client);
                return;
            }

            // Issue a new subscription token on the client.
            const token = await SubscriptionToken.issue({
                receiver,
                validBearers: [`vt://${vt.id}`],
                // TODO: Support multiple actions
                subscribedTo: [action]
            });

            // Respond to the host with the information about the subscription token.
            this.chain.op('actions.subscribe.get-st.response', {
                subscriptionTokenId: token.id,
                subscriptionToken: token.jwt
            }).send(client);
        } catch (err) {
            const error = (Object.entries(err).length > 0) ? err : (err.stack || err.message || `${err}`);
            this.chain.op('actions.subscribe.client-response', {
                error
            }).send(client);
        }
    }
};