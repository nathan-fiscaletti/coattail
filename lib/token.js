const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const moment = require(`moment`);
const { pick } = require(`lodash`);
const { EOL } = require('os');
const { table, getBorderCharacters  } = require(`table`);
const chalk = require(`chalk`);
const { tables } = require(`./data/connection`);
const ipRangeCheck  = require(`ip-range-check`);

class Token {
    static async issue(config, connection, {validBearers, notBefore, expiresIn, performable, publishable, subscribable}={}) {
        notBefore = notBefore === undefined ? 0 : notBefore;
        performable = performable || [];
        publishable = publishable || [];
        subscribable = subscribable || [];
        validBearers = validBearers || ['0.0.0.0/0'];

        let key = config.authentication.private_key.value;
        if (config.authentication.private_key.type === 'file') {
            key = fs.readFileSync(key);
        }

        const issuer = Token.getTokenIssuer(config);
        const jwtConfig = { issuer, notBefore, audience: issuer };

        if (expiresIn !== undefined) {
            jwtConfig.expiresIn = expiresIn;
        }

        const id = uuid();
        jwtConfig.jwtid = id;
        const token = jwt.sign({
            host: config.server.listen.host,
            port: config.server.listen.port,
            tls: !!config.server.tls.use_tls,
            validBearers,
            performable,
            publishable,
            subscribable
        }, key, jwtConfig);

        await connection(tables.ISSUED_TOKENS).insert({
            id, jwt: token
        });

        return new Token({id, jwt: token});
    }

    static async loadAll(connection) {
        return (await connection(tables.ISSUED_TOKENS)).map(
            row => row ? new Token(row) : undefined
        );
    }

    static async load(connection, id) {
        const [ row ] = await connection(tables.ISSUED_TOKENS).where('id', id);
        if (row === undefined) {
            return undefined;
        }
        return new Token(row);
    }

    static getTokenIssuer(config) {
        return `${config.server.listen.host}:${config.server.listen.port}`;
    }

    constructor({id, jwt}) {
        this.id = id;
        this.jwt = jwt;
    }

    async revoke(connection) {
        await connection(tables.ISSUED_TOKENS).where('id', this.id).del();
    }

    isValid() {
        return jwt.decode(this.jwt) !== null;
    }

    async tryAuthenticate(config, connection, bearer, extraVerifications={}) {
        let key = config.authentication.public_key.value;
        if (config.authentication.public_key.type === 'file') {
            key = fs.readFileSync(key);
        }

        const result = jwt.verify(this.jwt, key, {
            issuer: Token.getTokenIssuer(config),
            ...extraVerifications
        });

        const id = result.jti;
        const [ row ] = await connection(tables.ISSUED_TOKENS).where('id', id);
        if (row === undefined) {
            throw new Error('Invalid, expired or revoked token.');
        }

        let isBearerValid = false;
        for(const validBearer of result.validBearers) {
            if(ipRangeCheck(bearer, validBearer)) {
                isBearerValid = true;
                break;
            }
        }

        if (!isBearerValid) {
            throw new Error(`Token is not valid for bearer '${bearer}'.`);
        }

        return result;
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

    print(
        {showId = true, writer = process.stdout, newLineChar=EOL}
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

        writer.write(newLineChar);

        const data = [
            [chalk.hex('#4e88e6')('Issued At'), chalk.italic(moment(claims.iat * 1000).toISOString())],
            [chalk.hex('#4e88e6')('Effective At'), chalk.italic(effective_at)],
            [chalk.hex('#4e88e6')('Expires At'), chalk.italic(expires_at)],
            [chalk.hex('#4e88e6')('Issuer'), chalk.italic(claims.iss)],
            [chalk.hex('#4e88e6')('Audience'), chalk.italic(claims.aud)],
            [chalk.hex('#4e88e6')('Host'), chalk.italic(claims.host)],
            [chalk.hex('#4e88e6')('Port'), chalk.italic(claims.port)],
            [chalk.hex('#4e88e6')('Use TLS'), chalk.italic(claims.tls ? chalk.hex('#6ce64e')('Yes') : chalk.hex('#e6d74e')('No'))],
            [chalk.hex('#4e88e6')('Performable'), chalk.italic(claims.performable.length > 0 ? claims.performable : chalk.hex('#e6d74e')('None'))],
            [chalk.hex('#4e88e6')('Publishable'), chalk.italic(claims.publishable.length > 0 ? claims.publishable : chalk.hex('#e6d74e')('None'))],
            [chalk.hex('#4e88e6')('Subscribable'), chalk.italic(claims.subscribable.length > 0 ? claims.subscribable : chalk.hex('#e6d74e')('None'))],
            [chalk.hex('#4e88e6')('Valid Bearers'), chalk.italic(claims.validBearers.includes('0.0.0.0/0') ? chalk.hex('#e6d74e')('Any') : claims.validBearers)],
        ];

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