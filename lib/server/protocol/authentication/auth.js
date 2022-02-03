const { tryAuthenticateToken } = require(`../../authentication`);

const clientOperations = require(`../../../protocol-loader`)('client');

const authenticatedOnly = false;

const make = (...data) => {
    return {
        opCode: 'authentication.auth',
        parameters: data
    };
}

const process = (session, token) => {
    try {
        tryAuthenticateToken(session.config, token);
        session.persistent.isAuthenticated = true;
        session.logger.info(`session ${session.id} authenticated`);
        clientOperations.get('authentication.auth_response').send(
            session, true,
            session.config.server.keep_alive_interval,
            session.id
        );
        session.startMonitoringActivity();
    } catch (error) {
        clientOperations.get('authentication.auth_response').send(session, false, 0, '', () => {
            session.stream.end();
        });
    }
};

const send = (io, token, cb) => {
    io.write(make(token), cb);
};

module.exports = {
    authenticatedOnly,
    process,
    send
};