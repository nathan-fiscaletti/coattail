const Token = require(`./token`);

const tables = require(`../data/tables`);

// We specifically extend Token here since this will be used as an
// authentication token later on.
class SubscriptionToken extends Token {
    //@on-client
    static async issue({database, receiver, validBearers, subscribedTo}={}) {
        subscribedTo = subscribedTo || [];
        validBearers = validBearers || ['ipv4://0.0.0.0/0'];

        return await Token.issue({type: 'Subscription', database, validBearers, subscribedTo, receiver});
    }    
}

module.exports = SubscriptionToken;