const Model = require(`./data/model`);
const tables = require(`./data/tables`);
const jwt = require(`jsonwebtoken`);
const Operations = require(`./protocol`);

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

    authTokenId() {
        return this.claims().authenticationTokenId;
    }
    
    receiver() {
        return this.claims().receiver;
    }

    peerId() {
        return this.claims().peerId;
    }

    subscriptionTokenId() {
        return this.claims().jti;
    }
}

module.exports = Subscription;