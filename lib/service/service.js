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

        if (config.get().service.tls.enabled) {
            if (!config.get().service.tls.key || typeof config.get().service.tls.key !== 'string') {
                throw new Error('Missing private_key or invalid value set in tlsConfig');
            }
            try {
                fs.accessSync(config.get().service.tls.key, fs.constants.R_OK);
            } catch (error) {
                throw new Error(`Cannot read privateKey file '${config.get().service.tls.key}' from tlsConfig: ${error}`);
            }

            if (!config.get().service.tls.cert || typeof config.get().service.tls.cert !== 'string') {
                throw new Error('Missing private_key or invalid value set in tlsConfig');
            }
            try {
                fs.accessSync(config.get().service.tls.cert, fs.constants.R_OK);
            } catch (error) {
                throw new Error(`Cannot read certificate file '${config.get().service.tls.certificate}' from tlsConfig: ${error}`);
            }
        }
    }

    setSessionIdFactory(sessionIdFactory) {
        this.sessionIdFactory = sessionIdFactory;
    }

    listen() {
        if (config.get().service.tls.enabled) {
            this.service = tls.createServer({
                key: fs.readFileSync(config.get().service.tls.key),
                cert:  fs.readFileSync(config.get().service.tls.cert),
                keepAlive: true
            }, (socket) => this.handleNewClient(socket));
        } else {
            this.service = net.createServer({
                keepAlive: true
            }, (socket) => this.handleNewClient(socket));
        }

        this.service.on('error', (error) => {
            this.emit('error', error);
        });

        this.service.listen(config.get().service.network.port, config.get().service.network.address.bind, () => {
            this.emit('listening', config.get().service.network.port, config.get().service.network.address.bind);
        });
    }

    handleNewClient(socket) {
        new Session(this, this.sessionIdFactory.getNextSessionId(), socket).listen();
    }
}

module.exports = Service;