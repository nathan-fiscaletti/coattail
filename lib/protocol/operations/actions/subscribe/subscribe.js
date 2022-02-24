const SubscriptionToken = require(`../../../../tokens/subscription-token`);
const ActionManager = require(`../../../../action-manager`);
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
        const {token} = this.data;

        const subscriptionToken = new SubscriptionToken({jwt: token});
        const subscribedTo = subscriptionToken.subscribedTo();

        if (subscribedTo.length < 1) {
            this.chain.op('actions.subscribe.response', {
                error: `Must provide actions to subscribe.`,
                subscription: null
            }).send(session);
            return;
        }

        // Validate that this session is allowed to subscribe to the actions.
        if (!session.token.subscribable().includes('*')) {
            for (const subAction of subscribedTo) {
                // TODO: Let actions work with paths
                if (!session.token.subscribable().includes(subAction)) {
                    this.chain.op('actions.subscribe.response', {
                        error: `Not permitted to subscribe to action '${subAction}'`,
                        subscription: null
                    }).send(session);
                    return;
                }
            }
        }

        // Validate that each of the actions exist.
        const am = new ActionManager();
        for (const subAction of subscribedTo) {
            try {
                await am.load(subAction);
            } catch (_) {
                this.chain.op('actions.subscribe.response', {
                    error: `Action named '${subAction}' is unavailable.`,
                    subscription: null
                }).send(session);;
                return;
            }
        }

        // Store the subscription.
        try {
            await subscriptionToken.save({ database: session.server.database });
        } catch (error) {
            this.chain.op('actions.subscribe.response', {
                error: error.message,
                subscription: null
            }).send(session);;
            return;
        }

        session.logger.info(`subscribed to actions: ${subscribedTo}`);
        this.chain.op('actions.subscribe.response', {
            error: null,
            subscription: subscriptionToken.id
        }).send(session);
    }
};