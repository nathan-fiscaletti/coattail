const Server = require(`../../server/server`);

module.exports = () => {
    const config = require(`../../server/config`).load();
    const server = new Server(config);

    server.on('listening', function(port, host) {
        server.logger.info(`listening on ${host}:${port}`);
    });

    server.on('error', function(error) {
        server.logger.error(error);
    });

    server.listen();
}