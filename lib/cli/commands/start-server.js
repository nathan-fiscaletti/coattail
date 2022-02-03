const log = require(`../../log`);
const Server = require(`../../server/server`);

const logger = log(`Server`);

module.exports = () => {
    const config = require(`../../server/config`).load();
    const server = new Server(config, logger);

    server.on('listening', function(port, host) {
        logger.info(`listening on ${host}:${port}`);
    });

    server.on('error', function(error) {
        logger.error(error);
    });

    server.listen();
}