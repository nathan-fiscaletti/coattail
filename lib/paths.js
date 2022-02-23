const path = require(`path`);

module.exports = {
    CMD_PATH: path.join(__dirname, '..', 'bin', 'index.js'),
    SERVER_PID_PATH: path.join(__dirname,  '..', '.server.pid'),
    DEFAULTS: {
        SERVER_LOG: path.join(__dirname, '..', 'logs', 'server.log')
    }
}