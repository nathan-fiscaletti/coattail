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
        console.log('authentication failed');
        return;
    }

    console.log(`authentication successful, session id: ${sessionId}`)
    client.sessionId = sessionId;
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