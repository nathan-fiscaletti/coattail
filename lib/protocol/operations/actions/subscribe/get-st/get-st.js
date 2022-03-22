const Operation = require("../../../../operation");
const ValidationToken = require(`../../../../../tokens/validation-token`);
const Token = require("../../../../../tokens/token");

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
            const {authenticationTokenId, validationToken, action, receiver} = this.data;

            // Save the validation token on the client for future
            // requests.
            let vt;
            try {
                vt = new ValidationToken({jwt: validationToken})
                await vt.save();
            } catch (_) {
                this.chain.op(`actions.subscribe.client-response`, {
                    error: `Failed to save validation token on subscriber.`
                }).send(client);
                return;
            }

            // Issue a new subscription token on the client.
            const token = await Token.issueSubscription({authenticationTokenId, validationToken: vt, subscribedTo: [action], receiver});

            // Respond to the host with the information about the subscription token.
            this.chain.op('actions.subscribe.get-st.response', {
                publicationTokenId: token.id,
                publicationToken: token.jwt
            }).send(client);
        } catch (err) {
            const error = (Object.entries(err).length > 0) ? err : (err.stack || err.message || `${err}`);
            this.chain.op('actions.subscribe.client-response', {
                error
            }).send(client);
        }
    }
};