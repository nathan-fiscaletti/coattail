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
            socket = tls.connect({
                checkServerIdentity: (_, cert) => {
                    if (peer.token.issuer() === cert.subject.CN) {
                        return undefined;
                    }

                    return new Error('Invalid server identity.');
                },
                ca: [ config.cert ],
                port: config.port,
                host: config.host,
                keepAlive: true
            });
        } else {
            socket = net.connect({port: config.port, host: config.host, keepAlive: true});
        }

        return new Client(config, logger, socket, timeout);
    }

    constructor(config, logger, socket, timeout) {
        super(logger, Operation.DIRECTION.CLIENT_TO_HOST, encoder, socket, Initiater.CLIENT);
        this.config = config;
        this.baseLogger = logger;

        this.socket.setTimeout(timeout);

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
        this.socket.on('timeout', () => {
            this.logger.error(`timed out after ${timeout}ms`);
            this.disconnect();
            this.emit('error', new Error(`Timed out after ${timeout}ms`));
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

    _notifyAuthenticated({authenticated, sessionId}) {
        if (!authenticated) {
            this.logger.warning('authentication failed');
            this.emit('auth-failed');
            return;
        }
    
        this.logger.info(`authentication successful, session id: ${sessionId}`)
        this.sessionId = sessionId;
        this.logger = this.logger.child(`sess-${sessionId}`);
        this.emit('ready');
    }

    disconnect() {
        this.socket.destroy();
        this.messageBuffer.clear();
        this.logger.warning('disconnected');
        this.logger = this.baseLogger;
    }
}

module.exports = Client;