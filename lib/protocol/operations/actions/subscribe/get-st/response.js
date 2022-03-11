const Operation = require("../../../../operation");

const Subscription = require(`../../../../../subscription`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Operation.TYPE.CONTINUATION,
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
        const { publicationToken: jwt, publicationTokenId } = this.data;

        const subscription = new Subscription({jwt});

        // Store the subscription.
        try {
            await subscription.save({ database: session.service.database });
        } catch (err) {
            const error = (Object.entries(err).length > 0) ? err : (err.stack || err.message || `${err}`);
            this.chain.op('actions.subscribe.response', {
                error
            }).send(session).catch(_ => { /* discarded */ });
            return;
        }

        this.chain.op('actions.subscribe.response', {
            publicationTokenId
        }).send(session).catch(_ => { /* discarded */ });
    }
};