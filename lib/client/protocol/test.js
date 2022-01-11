const make = () => {
    return {
        opCode: "test",
        parameters: []
    };
}

// called from the client
const process = (client) => {
    // no op
};

// called from the server
const send = (io, cb) => {
    io.write(make(), cb);
};

module.exports = {
    process,
    send
};