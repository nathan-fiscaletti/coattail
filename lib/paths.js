const path = require(`path`);

module.exports = {
    ROOT: path.join(__dirname, '..'),
    LIB: __dirname,
    CMD_PATH: path.join(__dirname, '..', 'bin', 'index.js'),
    DEFAULTS: {
        SERVICE_LOG: path.join(__dirname, '..', 'logs', 'service.log')
    }
}