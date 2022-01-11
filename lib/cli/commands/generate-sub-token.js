const { generateToken } = require(`../../server/authentication`);

module.exports = (notBefore, expiresIn, audience, channel, ...events) => {
    const config = require(`../../server/config`).load();
    const token = generateToken(config, {
        notBefore,
        expiresIn: expiresIn === 'never' ? undefined : expiresIn,
        audience: audience == '*' ? undefined : audience,
        channel,
        events
    });

    console.log(token);
}