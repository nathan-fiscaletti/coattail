const tls = require(`tls`);
const net = require(`net`);
const fs = require('fs');
const EventEmitter = require('events');
const Session = require(`./session`);
const { db } = require(`../data/connection`);
const SessionIdFactories = require(`./session-id-factories`);
const log = require(`../log`);

class Server extends EventEmitter {
    constructor(config, logger=log(`Server`)) {
        super();
        this.nextSessionId = 1;

        this.config = config;
        this.logger = logger;

        if (config.server.session_id_factory === 'incremental') {
            this.sessionIdFactory = SessionIdFactories.Incremental;
        } else if (config.server.session_id_factory === 'uuid') {
            this.sessionIdFactory = SessionIdFactories.UUIDv4;
        }

        this.database = db();

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
            if(this.config.server.tls.certificate_authorities) {
                for (const certificate_authority of this.config.server.tls.certificate_authorities) {
                    if (typeof certificate_authority !== 'string') {
                        throw new Error(`Invalid value set for certificate_authorities: Values must be strings representing paths to a file on disk.`);
                    }
                    try {
                        fs.accessSync(certificate_authority, fs.constants.R_OK);
                    } catch (error) {
                        throw new Error(`Cannot read Certificate Authority file '${certificate_authority}' from tlsConfig: ${error}`);
                    }
                }
            }
        }
    }

    setSessionIdFactory(sessionIdFactory) {
        this.sessionIdFactory = sessionIdFactory;
    }

    listen() {
        if (this.config.server.tls.use_tls) {
            const properties = {
                key: fs.readFileSync(this.config.server.tls.private_key),
                cert:  fs.readFileSync(this.config.server.tls.certificate),
            };
            if (this.config.server.tls.certificate_authorities) {
                properties.ca = [];
                for (const certificate_authority of this.config.server.tls.certificate_authorities) {
                    properties.ca.push(fs.readFileSync(certificate_authority));
                }
            }

            this.server = tls.createServer({
                
            }, this.handleNewClient);
        } else {
            this.server = net.createServer((socket) => this.handleNewClient(socket));
        }

        this.server.on('error', (error) => {
            this.emit('error', error);
        });

        this.server.listen(this.config.server.listen.port, this.config.server.listen.host, () => {
            this.emit('listening', this.config.server.listen.port, this.config.server.listen.host);
        });
    }

    handleNewClient(socket) {
        new Session(this.config, this, this.sessionIdFactory.getNextSessionId(), socket).listen();
    }
}

module.exports = Server;