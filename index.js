// const config = require(`./lib/config`).load();

// const { protocol } = require(`./lib/proto/auth`);

// protocol.local(config, '1d');

// const token = generateToken(config, 500);
// console.log(token);
// const decoded = tryAuthenticateToken(config, token);
// console.log(decoded);

const config = require(`./lib/server/config`).load();

const Server = require('./lib/server/server');
const server = new Server(config);

server.on('listening', function(port, host) {
    console.log(`listening on ${host}:${port}`);
});

server.on('error', function(error) {
    console.log(error);
});

server.listen(1234);