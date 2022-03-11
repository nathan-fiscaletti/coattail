const Model = require(`./data/model`);
const tables = require(`./data/tables`);
const jwt = require(`jsonwebtoken`);

class Subscription extends Model {
    static table = tables.SUBSCRIPTIONS;

    claims() {
        return jwt.decode(this.jwt);
    }

    issuer() {
        return this.claims().iss;
    }

    subscribedTo() {
        return this.claims().subscribedTo;
    }
}

module.exports = Subscription;