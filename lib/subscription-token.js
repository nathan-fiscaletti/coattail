const tables = require(`./data/tables`);
const Token = require("./token");

// We specifically extend Token here since this will be used as an
// authentication token later on.
class SubscriptionToken extends Token {
    static table = tables.SUBSCRIPTIONS;

    static async issue(config, {database, validBearers, subscribedTo}={}) {
        subscribedTo = subscribedTo || [];
        validBearers = validBearers || ['ipv4://0.0.0.0/0'];
        return await Token.issue(config, {database, validBearers, subscribedTo});
    }
}

module.exports = SubscriptionToken;