const { queue } = require(`../../../action-queue`);

const make = (action, data) => {
    return {
        opCode: "actions.queue",
        parameters: [action, data]
    };
}

// terminal message chain
const process = (session, action, data) => {
    queue(action, data, session.server.connection);
};

const send = (io, action, data, cb) => {
    io.write(make(action, data), cb);
};

module.exports = {
    authenticatedOnly: true,
    process,
    send
};