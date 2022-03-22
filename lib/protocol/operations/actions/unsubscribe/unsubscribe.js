const Operation = require(`../../../operation`);
const Subscription = require(`../../../../subscription`);
const Token = require(`../../../../tokens/token`);
const ValidationToken = require(`../../../../tokens/validation-token`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Operation.TYPE.FIRE_AND_FORGET,
            Operation.DIRECTION.CLIENT_TO_HOST,
            {
                opCode,
                chain,
                data
            }
        );
    }

    //@on-either
    async handle(connection) {
        const { action, receiver, subscriptionTokenId } = this.data;

        if (!subscriptionTokenId) {
            // Client ubsubscribing from publisher.
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
        } else {
            // Publisher removing subscriber
            let subscriptionToken;
            try {
                subscriptionToken = await Token.load({id: subscriptionTokenId});
            } catch (err) {
                connection.logger.error(`failed to load subscription token with id ${subscriptionTokenId}`);
                connection.logger.error(err);
            }

            if (!subscriptionToken) {
                connection.logger.warning(`publisher attempting to revoke subscription that does not exist with id ${subscriptionTokenId}`);
                return;
            }

            if (subscriptionToken.claims().jti !== connection.token.claims().jti) {
                connection.logger.warning(`publisher attempting to revoke subscription with mismatched authentication token. authenticated with ${connection.token.claims().jti}, attempting to revoke ${subscriptionToken.claims().jti}`);
                return;
            } else {
                const [ action ] = subscriptionToken.subscribedTo();
                const receiver = subscriptionToken.claims().receiver;
                connection.logger.info(`publisher revoking subscription for '${action} -> ${receiver}'...`);

                // Delete Validation Tokens
                const bearers = subscriptionToken.validBearers();
                for (const bearer of bearers) {
                    if (bearer.type === 'vt') {
                        try {
                            const vt = await ValidationToken.load({id: bearer.value});
                            await vt.delete();
                            connection.logger.info(`removed validation token ${bearer.value}`);
                        } catch (error) {
                            connection.logger.error(`failed to remove validation token ${bearer.value}`);
                            connection.logger.error(error);
                        }
                    }
                }

                // Delete Subscription Token
                try {
                    await subscriptionToken.delete();
                    connection.logger.info(`revoked subscription token ${subscriptionTokenId}`);
                } catch (error) {
                    connection.logger.error(`failed to revoke subscription token`);
                    connection.logger.error(error);
                }
            }
        }
    }
};