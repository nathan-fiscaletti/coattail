const Operation = require(`../../../operation`);
const Subscription = require(`../../../../subscription`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Operation.TYPE.FIRE_AND_FORGET,
            Operation.DIRECTION.BI_DIRECTIONAL,
            {
                opCode,
                chain,
                data
            }
        );
    }

    //@on-either
    async handle(connection) {
        const { action, receiver } = this.data;

        const matchingSubscriptions = await Subscription.loadAllMatching({matches: sub => {
            return sub.subscribedTo().includes(action) &&
                    sub.receiver() == receiver &&
                    sub.authTokenId() === connection.token.claims().jti;
        }});

        connection.logger.info(`attempting to unsubscribe from subscription: '${action} -> ${receiver}'...`);
        const totalSubscriptions = matchingSubscriptions.length;
        const subscriptionsRemoved = 0;
        if (totalSubscriptions > 0) {
            for (const matchingSubscription of matchingSubscriptions) {
                try {
                    await matchingSubscription.delete();
                    subscriptionsRemoved += 1;
                } catch (error) {
                    connection.logger.error(error);
                }
            }
        }
        connection.logger.info(`removed ${subscriptionsRemoved} of ${totalSubscriptions} subscriptions found matching '${action} -> ${receiver}'`);
        // if (connection.direction === Operation.DIRECTION.CLIENT_TO_HOST) {
            
        // }
    }
};