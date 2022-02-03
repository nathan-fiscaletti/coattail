const make = (authenticated, keepAliveInterval, sessionId) => {
    return {
        opCode: "authentication.auth_response",
        parameters: [ authenticated, keepAliveInterval, sessionId]
    };
}

// called from the client
const process = (client, success, keepAliveInterval, sessionId) => {
    // terminal message chain
    if (!success) {
        client.logger.warning('authentication failed');
        return;
    }

    client.logger.warning(`authentication successful, session id: ${sessionId}`)
    client._setSessionId(sessionId);
    client.emit('authenticated');
    client._startKeepAlive(keepAliveInterval);
};

// called from the server
const send = (io, authenticated, keepAliveInterval, sessionId, cb) => {
    io.write(make(
        authenticated,
        keepAliveInterval,
        sessionId
    ), cb);
};

module.exports = {
    process,
    send
};