const jwt = require('jsonwebtoken');

const getIssuer = (config) => {
    return `${config.server.listen.host}:${config.server.listen.port}`;
}

const generateToken = (config, properties) => {
    const audience = properties.audience;
    const notBefore = properties.notBefore === undefined ? 0 : properties.notBefore;
    const expiresIn = properties.expiresIn;
    
    // Required properties
    const channel = properties.channel;
    const events = properties.events;

    if (!channel) {
        throw new Error('Must provide channel to generate token.');
    }

    if (!events) {
        throw new Error('Must provide events to generate token.')
    }

    if (!Array.isArray(events)) {
        throw new Error('Events must be an array of strings.');
    }

    let key = config.authentication.private_key.value;
    if (config.authentication.private_key.type === 'file') {
        key = fs.readFileSync(key);
    }

    const issuer = getIssuer(config);
    const jwtConfig = { issuer, notBefore };

    if (audience !== undefined) {
        jwtConfig.audience = audience;
    }
    if (expiresIn !== undefined) {
        jwtConfig.expiresIn = expiresIn;
    }

    return jwt.sign({
        host: config.server.listen.host,
        port: config.server.listen.port,
        channel,
        events
    }, key, jwtConfig);
};

const tryAuthenticateToken = (config, token, additionalAuthMetrics) => {
    let key = config.authentication.public_key.value;
    if (config.authentication.public_key.type === 'file') {
        key = fs.readFileSync(key);
    }

    return jwt.verify(token, key, { issuer: getIssuer(config), ...additionalAuthMetrics });
};

module.exports = {
    generateToken,
    tryAuthenticateToken
};