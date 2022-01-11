const Server = require(`../../server/server`);

module.exports = () => {
    const config = require(`../../server/config`).load();
    const server = new Server(config);

    server.on('listening', function(port, host) {
        console.log(`listening on ${host}:${port}`);
    });

    server.on('error', function(error) {
        console.log(error);
    });

    server.listen();
}