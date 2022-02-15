const jsonwebtoken = require(`jsonwebtoken`);
const Token = require(`./token`);
const Model = require(`./data/model`);
const tables = require(`./data/tables`);
const { EOL } = require('os');
const moment = require(`moment`);
const chalk = require(`chalk`);
const { table, getBorderCharacters  } = require(`table`);

class ValidationToken extends Model {
    static table = tables.VALIDATION_TOKENS;

    static async issue(config, {notBefore, expiresIn}={}) {
        let pubKey = config.authentication.public_key.value;
        if (config.authentication.public_key.type === 'file') {
            pubKey = fs.readFileSync(pubKey);
        }

        const issuer = Token.getTokenIssuer(config);

        const jwtConfig = { issuer, audience: issuer };
        if (expiresIn !== undefined) {
            jwtConfig.expiresIn = expiresIn;
        }
        jwtConfig.notBefore = notBefore === undefined ? 0 : notBefore;
        jwtConfig.algorithm = 'none';

        const token = jsonwebtoken.sign({
            publicKey: pubKey
        }, '', jwtConfig);

        return new ValidationToken({jwt: token});
    }

    static async getSignature(config) {
        let pubKey = config.authentication.public_key.value;
        if (config.authentication.public_key.type === 'file') {
            pubKey = fs.readFileSync(pubKey);
        }
        return jsonwebtoken.sign({}, pubKey);
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
        const pubKey = data.publicKey;
        jsonwebtoken.verify(signature, pubKey);
    }

    claims() {
        return jsonwebtoken.decode(this.jwt);
    }

    issuer() {
        return this.claims().iss;
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

        writer.write(`${output}${newLineChar}`);
    }
}

module.exports = ValidationToken;