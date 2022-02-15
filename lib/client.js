const tls = require(`tls`);
const net = require(`net`);
const Connection = require(`./connection`);
const encoder = require(`./encoding`);
const log = require(`./log`);
const Operation = require(`./protocol/operation`);
const Initiater = require(`./protocol/initiater`);
const Operations = require(`./protocol`);
const ValidationToken = require("./validation-token");

// each subscription contains all of the connection options
class Client extends Connection {
    static connect(peer, logger=log('Client')) {
        let socket;

        const config = peer.token.getClientConfig();
        if (config.tls) {
            socket = tls.connect(config.port, config.host);
        } else {
            socket = net.connect(config.port, config.host);
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
            this.logger.warning(`closed connection to ${this.config.host}:${this.config.port}`);
            this.logger = this.baseLogger;
        });
    }

    _authenticate() {
        Operations.get(`auth`, {
            auth: this.config.auth,
            signature: ValidationToken.getSignature(require(`./server/config`).load())
        }).send(this);
    }

    _notifyAuthenticated({authenticated, keepAliveInterval, sessionId}) {
        if (!authenticated) {
            this.logger.warning('authentication failed');
            this.emit('auth-failed');
            return;
        }
    
        this.logger.info(`authentication successful, session id: ${sessionId}`)
        this.sessionId = sessionId;
        this.logger = this.logger.child(`sess-${sessionId}`);
        this.logger.info(`starting keep alive with interval ${keepAliveInterval}`);
        this.keepalive = setInterval(() => {
            Operations.get('keep-alive').send(this);
        }, keepAliveInterval);
        this.emit('ready');
    }

    disconnect() {
        if (this.keepalive) {
            clearInterval(this.keepalive);
        }
        this.socket.destroy();
        this.logger.warning('disconnected');
        this.logger = this.baseLogger;
    }
}

module.exports = Client;