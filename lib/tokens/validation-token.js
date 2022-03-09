const jsonwebtoken = require(`jsonwebtoken`);
const Model = require(`../data/model`);
const tables = require(`../data/tables`);
const fs = require(`fs`);
const moment = require(`moment`);
const chalk = require(`chalk`);
const { table, getBorderCharacters  } = require(`table`);
const config = require(`../config`);

class ValidationToken extends Model {
    static table = tables.VALIDATION_TOKENS;

    static async issue({notBefore, expiresIn}={}) {
        const conf = config.get();

        const issuer = ValidationToken.getTokenIssuer();
        const jwtConfig = { issuer, audience: issuer };

        let pubKey = conf.validation.public_key.value;
        if (conf.validation.public_key.type === 'file') {
            pubKey = fs.readFileSync(pubKey).toString();
        }

        if (expiresIn !== undefined) {
            jwtConfig.expiresIn = expiresIn;
        }

        jwtConfig.notBefore = notBefore === undefined ? 0 : notBefore;
        jwtConfig.algorithm = 'none';

        const token = jsonwebtoken.sign({
            keyType: conf.validation.public_key.type,
            publicKey: pubKey
        }, '', jwtConfig);

        return new ValidationToken({jwt: token});
    }

    static getTokenIssuer() {
        let key = config.get().validation.public_key.value;
        if (config.get().validation.public_key.type === 'file') {
            key = fs.readFileSync(key).toString();
        }

        return crypto.createHash('sha256').update(key).digest('base64').toString();
    }

    static async getSignature() {
        const jwtConfig = {};
        let privKey = config.get().validation.private_key.value;
        if (config.get().validation.private_key.type === 'file') {
            privKey = fs.readFileSync(privKey);
            jwtConfig.algorithm = 'RS256';
        }
        return jsonwebtoken.sign({}, privKey, jwtConfig);
    }

    constructor({id, jwt}) {
        super({id, jwt});
        const data = jsonwebtoken.verify(this.jwt, '');
        if (!data.publicKey) {
            throw new Error('Invalid or malformed validation token.');
        }
    }

    validate(signature) {
        const data = jsonwebtoken.decode(this.jwt);
        const type = data.keyType;
        const pubKey = data.publicKey;

        if (type === 'string') {
            jsonwebtoken.verify(signature, pubKey);
        } else if (type === 'file') {
            jsonwebtoken.verify(signature, Buffer.from(pubKey, 'utf8'));
        } else {
            throw new Error(`Unknown key type in validation token.`);
        }
    }

    claims() {
        return jsonwebtoken.decode(this.jwt);
    }

    issuer() {
        return this.claims().iss;
    }

    print(
        {showId = true, outputHandler = (lines) => lines.forEach(l => console.log(l))}
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

        const data = [
            [chalk.hex('#4e88e6')('Issued At'), chalk.italic(moment(claims.iat * 1000).toISOString())],
            [chalk.hex('#4e88e6')('Effective At'), chalk.italic(effective_at)],
            [chalk.hex('#4e88e6')('Expires At'), chalk.italic(expires_at)],
            [chalk.hex('#4e88e6')('Issuer Hash'), chalk.italic(claims.iss)],
        ];

        if (showId) {
            data.unshift([chalk.hex('#4e88e6')('Validation Token ID'), chalk.italic(this.id)]);
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

module.exports = ValidationToken;