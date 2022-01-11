const tls = require(`tls`);
const net = require(`net`);
const fs = require('fs');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const Session = require(`./session`);

/*

actions/suckdick.yaml
coattail do suckdick


coattail subscribe <jwttoken>
created subscription configuration at subscriptions/asdf.yaml

coattail listen asdf.yaml

*/

class Server extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;

        if (this.config.server.tls.use_tls) {
            if (!this.config.server.tls.private_key || typeof this.config.server.tls.private_key !== 'string') {
                throw new Error('Missing private_key or invalid value set in tlsConfig');
            }
            try {
                fs.accessSync(this.config.server.tls.private_key, fs.constants.R_OK);
            } catch (error) {
                throw new Error(`Cannot read privateKey file '${this.config.server.tls.private_key}' from tlsConfig: ${error}`);
            }

            if (!this.config.server.tls.certificate || typeof this.config.server.tls.certificate !== 'string') {
                throw new Error('Missing private_key or invalid value set in tlsConfig');
            }
            try {
                fs.accessSync(this.config.server.tls.certificate, fs.constants.R_OK);
            } catch (error) {
                throw new Error(`Cannot read certificate file '${this.config.server.tls.certificate}' from tlsConfig: ${error}`);
            }
        }
    }

    listen() {
        if (this.config.server.tls.use_tls) {
            this.server = tls.createServer({
                key: fs.readFileSync(this.config.server.tls.private_key),
                cert:  fs.readFileSync(this.config.server.tls.certificate)
            }, this.handleNewClient);
        } else {
            this.server = net.createServer((stream) => this.handleNewClient(stream));
        }

        this.server.on('error', (error) => {
            this.emit('error', error);
        });

        this.server.listen(this.config.server.listen.port, this.config.server.listen.host, () => {
            this.emit('listening', this.config.server.listen.port, this.config.server.listen.host);
        });
    }

    handleNewClient(stream) {
        const sessionId = uuidv4();
        new Session(this.config, sessionId, stream).listen();
    }
}

module.exports = Server;