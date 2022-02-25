const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const moment = require(`moment`);
const { pick } = require(`lodash`);
const { EOL } = require('os');
const { table, getBorderCharacters  } = require(`table`);
const chalk = require(`chalk`);
const tables = require(`../data/tables`);
const ipRangeCheck  = require(`ip-range-check`);
const Model = require(`../data/model`);
const ValidationToken = require(`./validation-token`);
const config = require(`../config`);

class Token extends Model {
    static table = tables.ISSUED_TOKENS;

    static async issue({database, type, validBearers, notBefore, expiresIn, performable, publishable, subscribable, subscribedTo, receiver}={}) {
        notBefore = notBefore === undefined ? 0 : notBefore;
        performable = performable || [];
        publishable = publishable || [];
        subscribable = subscribable || [];
        subscribedTo = subscribedTo || [];
        // bearers can either be `vt://{id}` or `ipv4://{addr}`
        validBearers = validBearers || ['ipv4://0.0.0.0/0'];
        type = type || 'Authentication';

        let key = config.get().authentication.private_key.value;
        if (config.get().authentication.private_key.type === 'file') {
            key = fs.readFileSync(key);
        }

        const issuer = Token.getTokenIssuer();
        const jwtConfig = { issuer, notBefore, audience: issuer };

        if (expiresIn !== undefined) {
            jwtConfig.expiresIn = expiresIn;
        }

        const id = uuid();
        jwtConfig.jwtid = id;
        const token = jwt.sign({
            host: config.get().server.listen.address,
            port: config.get().server.listen.port,
            tls: !!config.get().server.tls.use_tls,
            validBearers,
            performable,
            publishable,
            subscribable,
            subscribedTo,
            receiver,
            type
        }, key, jwtConfig);

        const res = new Token({jwt: token});
        res.save({database, newId: id});

        return res;
    }

    static loadAllMatching({database, matches}={}) {
        return new Promise((resolve, reject) => {
            this.loadAll({database}).then(tokens => {
                resolve(tokens.filter(token => matches(token)));
            }, reject);
        });
    }

    static getTokenIssuer() {
        return `${config.get().server.listen.address}:${config.get().server.listen.port}`;
    }

    isValid() {
        return jwt.decode(this.jwt) !== null;
    }

    async tryAuthenticate(connection, sourceIp, signature, extraVerifications={}) {
        let key = config.get().authentication.public_key.value;
        if (config.get().authentication.public_key.type === 'file') {
            key = fs.readFileSync(key);
        }

        const result = jwt.verify(this.jwt, key, {
            issuer: Token.getTokenIssuer(),
            ...extraVerifications
        });

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
            ...pick(this.claims(), ['tls', 'host', 'port']),
            auth: this.jwt
        };
    }

    type() {
        return this.claims().type || 'Authentication';
    }

    print(
        {showId = true, writer = process.stdout, newLineChar=EOL, extras={}}
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

        let typeColor = chalk.hex('#6ce64e');
        const type = this.type();
        if (type === 'Authentication') {
            typeColor = chalk.hex('#e6d74e');
        }

        writer.write(newLineChar);

        const data = [];
        for (const extraName of Object.keys(extras)) {
            const extraVal = extras[extraName];
            data.push([chalk.hex('#4e88e6')(extraName), chalk.italic(extraVal)]);
        }

        data.push([chalk.hex('#4e88e6')('Type'), chalk.italic(typeColor(type))]);
        data.push([chalk.hex('#4e88e6')('Issued At'), chalk.italic(moment(claims.iat * 1000).toISOString())]);
        data.push([chalk.hex('#4e88e6')('Effective At'), chalk.italic(effective_at)]);
        data.push([chalk.hex('#4e88e6')('Expires At'), chalk.italic(expires_at)]);
        data.push([chalk.hex('#4e88e6')('Issuer'), chalk.italic(claims.iss)]);
        data.push([chalk.hex('#4e88e6')('Audience'), chalk.italic(claims.aud)]);
        data.push([chalk.hex('#4e88e6')('Host'), chalk.italic(claims.host)]);
        data.push([chalk.hex('#4e88e6')('Port'), chalk.italic(claims.port)]);
        data.push([chalk.hex('#4e88e6')('Use TLS'), chalk.italic(claims.tls ? chalk.hex('#6ce64e')('Yes') : chalk.hex('#e6d74e')('No'))]);
        data.push([chalk.hex('#4e88e6')('Performable'), chalk.italic(claims.performable.length > 0 ? (claims.performable.includes('*') ? chalk.hex('#e6d74e')('Any') : claims.performable) : chalk.hex('#e6d74e')('None'))]);
        data.push([chalk.hex('#4e88e6')('Publishable'), chalk.italic(claims.publishable.length > 0 ? (claims.publishable.includes('*') ? chalk.hex('#e6d74e')('Any') : claims.publishable) : chalk.hex('#e6d74e')('None'))]);
        data.push([chalk.hex('#4e88e6')('Subscribable'), chalk.italic(claims.subscribable.length > 0 ? (claims.subscribable.includes('*') ? chalk.hex('#e6d74e')('Any') : claims.subscribable) : chalk.hex('#e6d74e')('None'))]);
        data.push([chalk.hex('#4e88e6')('Valid Bearers'), chalk.italic(claims.validBearers.includes('0.0.0.0/0') ? chalk.hex('#e6d74e')('Any') : claims.validBearers.join('\n'))]);

        if (type === 'Subscription') {
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

        writer.write(`${output}${newLineChar}`);
    }
}

module.exports = Token;