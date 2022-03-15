const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const moment = require(`moment`);
const { pick } = require(`lodash`);
const crypto = require(`crypto`);
const fs = require(`fs`);
const { table, getBorderCharacters  } = require(`table`);
const chalk = require(`chalk`);
const tables = require(`../data/tables`);
const ipRangeCheck  = require(`ip-range-check`);
const Model = require(`../data/model`);
const ValidationToken = require(`./validation-token`);
const config = require(`../config`);

class Token extends Model {
    static table = tables.ISSUED_TOKENS;

    static Uses = Object.freeze({
        PUBLISHING: 'Publisher Authentication',
        AUTHENTICATING: 'Authentication'
    });

    static async issueSubscription({database, authenticationTokenId, validationToken, subscribedTo, receiver}) {
        return this.issue({
            database,
            validBearers: [`vt://${validationToken.id}`],
            use: Token.Uses.PUBLISHING,
            authenticationTokenId,
            subscribedTo,
            receiver
        });
    }

    static async issue({database, use, validBearers, notBefore, expiresIn, performable, publishable, subscribable, ...extras}={}) {
        notBefore = notBefore === undefined ? 0 : notBefore;
        performable = performable || [];
        publishable = publishable || [];
        subscribable = subscribable || [];
        validBearers = validBearers || ['ipv4://0.0.0.0/0'];
        use = use || Token.Uses.AUTHENTICATING;

        const issuer = Token.getTokenIssuer();
        const jwtConfig = { issuer, notBefore, audience: issuer };

        let key = config.get().authentication.private_key.value;
        if (config.get().authentication.private_key.type === 'file') {
            key = fs.readFileSync(key);
            jwtConfig.algorithm = 'RS256';
        }

        if (expiresIn !== undefined) {
            jwtConfig.expiresIn = expiresIn;
        }

        let cert;
        if(config.get().service.tls.enabled) {
            cert = fs.readFileSync(config.get().service.tls.cert).toString();
        }

        const id = uuid();
        jwtConfig.jwtid = id;
        const token = jwt.sign({
            host: config.get().service.network.address.connection,
            port: config.get().service.network.port,
            tls: !!config.get().service.tls.enabled,
            validBearers,
            performable,
            publishable,
            subscribable,
            cert,
            use,
            ...extras
        }, key, jwtConfig);

        const res = new Token({jwt: token});
        await res.save({database, newId: id});

        return res;
    }

    static getTokenIssuer() {
        let key = config.get().validation.public_key.value;
        if (config.get().validation.public_key.type === 'file') {
            key = fs.readFileSync(key).toString();
        }

        return crypto.createHash('sha256').update(key).digest('base64').toString();
    }

    isValid() {
        return jwt.decode(this.jwt) !== null;
    }

    async tryAuthenticate(connection, sourceIp, signature, extraVerifications={}) {
        const properties = {
            issuer: Token.getTokenIssuer(),
            ...extraVerifications
        };

        let key = config.get().authentication.public_key.value;
        if (config.get().authentication.public_key.type === 'file') {
            key = fs.readFileSync(key);
            properties.algorithm = 'RS256';
        }

        const result = jwt.verify(this.jwt, key, properties);

        const id = result.jti;
        const [ row ] = await connection(tables.ISSUED_TOKENS).where('id', id);
        if (row === undefined) {
            throw new Error('Invalid, expired or revoked token.');
        }

        let isBearerValid = false;
        for(const validBearer of result.validBearers) {
            const [ type, data ] = validBearer.split('://');
            if (type === 'ipv4') {
                if(ipRangeCheck(sourceIp, data)) {
                    isBearerValid = true;
                    break;
                }
            } else if (type === 'vt') {
                const vt = await ValidationToken.load({database: connection, id: data});
                if (vt !== undefined && signature != undefined) {
                    try {
                        vt.validate(signature)
                        isBearerValid = true;
                    } catch (ignored) {}
                }
            }
        }

        if (!isBearerValid) {
            throw new Error(`Token is not valid for bearer '${sourceIp}'.`);
        }

        return result;
    }

    subscribable() {
        return this.claims().subscribable;
    }

    publishable() {
        return this.claims().publishable;
    }

    performable() {
        return this.claims().performable;
    }

    subscribedTo() {
        return this.claims().subscribedTo;
    }

    issuer() {
        return this.claims().iss;
    }

    claims() {
        return jwt.decode(this.jwt);
    }

    getClientConfig() {
        return {
            ...pick(this.claims(), ['tls', 'cert', 'host', 'port']),
            auth: this.jwt
        };
    }

    use() {
        return this.claims().use || Token.Uses.AUTHENTICATING;
    }

    print(
        {showId = true, outputHandler = (lines) => lines.forEach(l => console.log(l)), extras={}}
    ) {
        const claims = this.claims();

        let effective_at = 'now';
        if (claims.nbf) {
            const nbf = moment(claims.nbf * 1000);
            if (moment().diff(nbf) > 0) {
                effective_at = nbf.toISOString();
            }
        }

        let expires_at = 'never';
        if (claims.exp) {
            expires_at = moment(claims.exp * 1000).toISOString();
        }

        let useColor = chalk.hex('#6ce64e');
        const use = this.use();
        if (use === Token.Uses.AUTHENTICATING) {
            useColor = chalk.hex('#e6d74e');
        }

        const data = [];
        for (const extraName of Object.keys(extras)) {
            const extraVal = extras[extraName];
            data.push([chalk.hex('#4e88e6')(extraName), chalk.italic(extraVal)]);
        }

        data.push([chalk.hex('#4e88e6')('Use'), chalk.italic(useColor(use))]);
        data.push([chalk.hex('#4e88e6')('Issued At'), chalk.italic(moment(claims.iat * 1000).toISOString())]);
        data.push([chalk.hex('#4e88e6')('Effective At'), chalk.italic(effective_at)]);
        data.push([chalk.hex('#4e88e6')('Expires At'), chalk.italic(expires_at)]);
        data.push([chalk.hex('#4e88e6')('Issuer Hash'), chalk.italic(claims.iss)]);
        data.push([chalk.hex('#4e88e6')('Audience Hash'), chalk.italic(claims.aud)]);
        data.push([chalk.hex('#4e88e6')('Host'), chalk.italic(claims.host)]);
        data.push([chalk.hex('#4e88e6')('Port'), chalk.italic(claims.port)]);
        data.push([chalk.hex('#4e88e6')('Use TLS'), chalk.italic(claims.tls ? chalk.hex('#6ce64e')('Yes') : chalk.hex('#e6d74e')('No'))]);
        data.push([chalk.hex('#4e88e6')('Performable'), chalk.italic(claims.performable.length > 0 ? (claims.performable.includes('*') ? chalk.hex('#e6d74e')('Any') : claims.performable) : chalk.hex('#e64e4e')('None'))]);
        data.push([chalk.hex('#4e88e6')('Publishable'), chalk.italic(claims.publishable.length > 0 ? (claims.publishable.includes('*') ? chalk.hex('#e6d74e')('Any') : claims.publishable) : chalk.hex('#e64e4e')('None'))]);
        data.push([chalk.hex('#4e88e6')('Subscribable'), chalk.italic(claims.subscribable.length > 0 ? (claims.subscribable.includes('*') ? chalk.hex('#e6d74e')('Any') : claims.subscribable) : chalk.hex('#e64e4e')('None'))]);
        data.push([chalk.hex('#4e88e6')('Valid Bearers'), chalk.italic(claims.validBearers.includes('0.0.0.0/0') ? chalk.hex('#e6d74e')('Any') : claims.validBearers.join('\n'))]);

        if (use === Token.Uses.PUBLISHING) {
            data.push([chalk.hex('#4e88e6')('Subscribed To'), chalk.italic(claims.subscribedTo.join('\n'))]);
        }

        if (showId) {
            data.unshift([chalk.hex('#4e88e6')('Token ID'), chalk.italic(claims.jti)]);
        }

        const output = table(data, {
            border: getBorderCharacters('void'),
            columnDefault: {
                paddingLeft: 1,
                paddingRight: 1
            },
            columns: [ {}, {width: 50, wrapWord: true} ],
            drawHorizontalLine: () => false
        });

        outputHandler(output.split(/\r?\n/));
    }
}

module.exports = Token;