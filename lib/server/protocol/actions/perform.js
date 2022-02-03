const { perform } = require(`../../../action-queue`);

const make = (action, data) => {
    return {
        opCode: "actions.perform",
        parameters: [action, data]
    };
}

// terminal message chain
const process = (session, action, data) => {
    console.log(`performing action ${action}`);
    perform(action, data, session.server.connection);
};

const send = (io, action, data, cb) => {
    io.write(make(action, data), cb);
};

module.exports = {
    authenticatedOnly: true,
    process,
    send
};