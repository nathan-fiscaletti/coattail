const make = () => {
    return {
        opCode: "general.keep_alive",
        parameters: []
    };
}

// terminal message chain
const process = (session) => {
    session.lastKeepAliveAt = Date.now();
};

const send = (io, cb) => {
    io.write(make(), cb);
};

module.exports = {
    authenticatedOnly: true,
    process,
    send
};