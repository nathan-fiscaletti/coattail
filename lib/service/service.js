const tls = require(`tls`);
const net = require(`net`);
const fs = require('fs');
const EventEmitter = require('events');
const Session = require(`./session`);
const { db } = require(`../data/connection`);
const SessionIdFactories = require(`./session-id-factories`);
const log = require(`../log`);
const config = require(`../config`);

class Service extends EventEmitter {
    constructor(isHeadlessInstance, logger=log(`Service`, !isHeadlessInstance)) {
        super();
        this.nextSessionId = 1;

        this.logger = logger;

        if (config.get().service.session_id_factory === 'incremental') {
            this.sessionIdFactory = SessionIdFactories.Incremental;
        } else if (config.get().service.session_id_factory === 'uuid') {
            this.sessionIdFactory = SessionIdFactories.UUIDv4;
        }

        this.database = db();

        if (config.get().service.tls.use_tls) {
            if (!config.get().service.tls.private_key || typeof config.get().service.tls.private_key !== 'string') {
                throw new Error('Missing private_key or invalid value set in tlsConfig');
            }
            try {
                fs.accessSync(config.get().service.tls.private_key, fs.constants.R_OK);
            } catch (error) {
                throw new Error(`Cannot read privateKey file '${config.get().service.tls.private_key}' from tlsConfig: ${error}`);
            }

            if (!config.get().service.tls.certificate || typeof config.get().service.tls.certificate !== 'string') {
                throw new Error('Missing private_key or invalid value set in tlsConfig');
            }
            try {
                fs.accessSync(config.get().service.tls.certificate, fs.constants.R_OK);
            } catch (error) {
                throw new Error(`Cannot read certificate file '${config.get().service.tls.certificate}' from tlsConfig: ${error}`);
            }
            if(config.get().service.tls.certificate_authorities) {
                for (const certificate_authority of config.get().service.tls.certificate_authorities) {
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
        if (config.get().service.tls.use_tls) {
            const properties = {
                key: fs.readFileSync(config.get().service.tls.private_key),
                cert:  fs.readFileSync(config.get().service.tls.certificate),
            };
            if (config.get().service.tls.certificate_authorities) {
                properties.ca = [];
                for (const certificate_authority of config.get().service.tls.certificate_authorities) {
                    properties.ca.push(fs.readFileSync(certificate_authority));
                }
            }

            this.service = tls.createServer({
                
            }, this.handleNewClient);
        } else {
            this.service = net.createServer((socket) => this.handleNewClient(socket));
        }

        this.service.on('error', (error) => {
            this.emit('error', error);
        });

        this.service.listen(config.get().service.listen.port, config.get().service.listen.address, () => {
            this.emit('listening', config.get().service.listen.port, config.get().service.listen.address);
        });
    }

    handleNewClient(socket) {
        new Session(this, this.sessionIdFactory.getNextSessionId(), socket).listen();
    }
}

module.exports = Service;