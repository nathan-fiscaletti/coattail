const tls = require(`tls`);
const net = require(`net`);
const Connection = require(`../connection`);
const encoder = require(`../encoding`);
const log = require(`../log`);
const Operation = require(`../protocol/operation`);
const Initiater = require(`../protocol/initiater`);
const Operations = require(`../protocol`);

// EMITS: 'error', '_raw_unsafe_data'. 'authenticated', 'ready'

// each subscription contains all of the connection options
class Client extends Connection {
    static connect(config, logger=log('Client')) {
        let socket;

        if (config.client.tls.use_tls) {
            socket = tls.connect(config.client.port, config.client.host);
        } else {
            socket = net.connect(config.client.port, config.client.host);
        }

        return new Client(config, logger, socket);
    }

    constructor(config, logger, socket) {
        super(logger, Operation.DIRECTION.CLIENT_TO_HOST, encoder, socket, Initiater.CLIENT);
        this.config = config;
        this.baseLogger = logger;
        this.keepalive = undefined;

        const self = this;
        this.socket.on(`error`, function (err) {
            self.logger.error(err);
            self.emit('error', err);
            if (err.message.includes(`ECONNRESET`)) {
                self.disconnect();
            }
        });
        this.socket.on('ready', () => {
            this._authenticate();
        });
        this.socket.on('end', () => {
            this.logger.warning(`closed connection to ${this.config.client.host}:${this.config.client.port}`);
            this.logger = this.baseLogger;
        });

        this.logger.info(config);
    }

    _authenticate() {
        Operations.get(`auth`, {
            auth: this.config.client.auth
        }).send(this);
    }

    _notifyAuthenticated({authenticated, keepAliveInterval, sessionId}) {
        if (!authenticated) {
            this.logger.warning('authentication failed');
            this.emit('authenticated', false);
            this.emit('error', new Error('authentication failed'));
            return;
        }
    
        this.logger.info(`authentication successful, session id: ${sessionId}`)
        this.sessionId = sessionId;
        this.logger = this.logger.child(`sess-${sessionId}`);
        this.emit('authenticated', true);
        this.logger.info(`starting keep alive with interval ${keepAliveInterval}`);
        this.keepalive = setInterval(() => {
            Operations.get('keep-alive').send(this);
        }, keepAliveInterval);
        this.emit('ready');
    }

    disconnect() {
        clearInterval(this.keepalive);
        this.socket.destroy();
        this.logger.warning('disconnected');
        this.logger = this.baseLogger;
    }
}

module.exports = Client;