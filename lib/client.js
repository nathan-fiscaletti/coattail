const tls = require(`tls`);
const net = require(`net`);
const Connection = require(`./connection`);
const encoder = require(`./encoding`);
const log = require(`./log`);
const Operation = require(`./protocol/operation`);
const Initiater = require(`./protocol/initiater`);
const Operations = require(`./protocol`);
const ValidationToken = require("./tokens/validation-token");

// each subscription contains all of the connection options
class Client extends Connection {
    static connect(peer, timeout=5000, logger=log('Client')) {
        let socket;

        const config = peer.token.getClientConfig();
        if (config.tls) {
            socket = tls.connect(config.port, config.host);
        } else {
            socket = net.connect(config.port, config.host);
        }
        console.log(timeout);
        socket.setTimeout(timeout);

        return new Client(config, logger, socket);
    }

    constructor(config, logger, socket) {
        super(logger, Operation.DIRECTION.CLIENT_TO_HOST, encoder, socket, Initiater.CLIENT);
        this.config = config;
        this.baseLogger = logger;
        this.keepalive = undefined;

        this.socket.on(`error`, function (err) {
            this.logger.error(err);
            this.emit('error', err);
            if (err.message.includes(`ECONNRESET`)) {
                this.disconnect();
            }
        });
        this.socket.on('ready', () => {
            this._authenticate();
        });
        this.socket.on('end', () => {
            this.logger.warning(`closed connection to ${this.config.host}:${this.config.port}`);
            this.logger = this.baseLogger;
        });
        this.socket.on('timeout', () => {
            this.logger.error(`timed out after ${timeout}ms`);
            this.disconnect();
            this.emit('error', new Error(`timed out after ${timeout}ms`));
        });
    }

    _authenticate() {
        ValidationToken.getSignature().then(signature => {
            Operations.get(`auth`, {
                auth: this.config.auth,
                signature
            }).terminate(this, (...params) => this._notifyAuthenticated(...params))
              .catch(err => { throw err; });
        });
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
            Operations.get('keep-alive').send(this).catch(_ => { /* discard */ });
        }, keepAliveInterval);
        this.emit('ready');
    }

    disconnect() {
        if (this.keepalive) {
            clearInterval(this.keepalive);
        }
        this.socket.destroy();
        this.messageBuffer.clear();
        this.logger.warning('disconnected');
        this.logger = this.baseLogger;
    }
}

module.exports = Client;