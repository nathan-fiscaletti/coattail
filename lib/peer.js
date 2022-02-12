const jwt = require('jsonwebtoken');
const { pick, omit } = require(`lodash`);
const { v4: uuid } = require('uuid');
const moment = require(`moment`);

class Peer {
    static getTokenIssuer(config) {
        return `${config.server.listen.host}:${config.server.listen.port}`;
    }

    static issueToken(config, {audience, notBefore, expiresIn, performable, publishable, subscribable}={}) {
        notBefore = notBefore === undefined ? 0 : notBefore;
        performable = performable || [];
        publishable = publishable || [];
        subscribable = subscribable || [];

        let key = config.authentication.private_key.value;
        if (config.authentication.private_key.type === 'file') {
            key = fs.readFileSync(key);
        }

        const issuer = Peer.getTokenIssuer(config);
        const jwtConfig = { issuer, notBefore };

        if (audience !== undefined) {
            jwtConfig.audience = audience;
        }
        if (expiresIn !== undefined) {
            jwtConfig.expiresIn = expiresIn;
        }

        return new Peer(jwt.sign({
            host: config.server.listen.host,
            port: config.server.listen.port,
            tls: config.server.tls.use_tls,
            performable, publishable, subscribable
        }, key, jwtConfig));
    }

    static async loadAll(connection) {
        return (await connection('coattail_peers')).map(
            row => row ? new Peer(row.token, row.id) : undefined
        );
    }

    static async load(connection, id) {
        const [ row ] = await connection(
            'coattail_peers'
        ).where('id', id);
        if (row) {
            return new Peer(row.token, row.id);
        } else {
            return undefined;
        }
    }

    constructor(token, id) {
        this.token = token.toString();
        this.id = id || uuid();
    }

    isValid() {
        return jwt.decode(this.token) !== null;
    }

    tryAuthenticate(config, extraVerifications={}) {
        let key = config.authentication.public_key.value;
        if (config.authentication.public_key.type === 'file') {
            key = fs.readFileSync(key);
        }

        return jwt.verify(this.token, key, {
            issuer: Peer.getTokenIssuer(config),
            ...extraVerifications
        });
    }

    getIssuer() {
        return this.claims().iss;
    }

    claims() {
        return jwt.decode(this.token);
    }

    getClientConfig() {
        return {
            ...pick(this.claims(), ['tls', 'host', 'port']),
            auth: this.token
        };
    }

    getPrintable() {
        const claims = this.claims();
        return {
            id: this.id,
            period: {
                issued: moment(claims.iat * 1000).toISOString(),
                effective: {
                    from: (claims.nbf) ? moment(claims.nbf * 1000).toISOString() : 'the beginning of time',
                    to: (claims.exp) ? moment(claims.exp * 1000).toISOString() : 'the end of time'
                }
            },
            connection: pick(claims, ['tls', 'host', 'port']),
            actions: pick(claims, ['performable', 'publishable', 'subscribable'])
        };
    }
}

module.exports = Peer;