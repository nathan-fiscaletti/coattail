const tls = require(`tls`);
const net = require(`net`);
const EventEmitter = require("events");
const IO = require(`../io`);
const encoder = require(`../encoding`);

const clientOperations = require(`../protocol-loader`)('client');
const serverOperations = require(`../protocol-loader`)('server');

// each subscription contains all of the connection options
class Client extends IO {
    static connect(config, logger) {
        let socket;

        if (config.client.tls.use_tls) {
            socket = tls.connect(config.client.port, config.client.host);
        } else {
            socket = net.connect(config.client.port, config.client.host);
        }

        return new Client(socket, config, logger);
    }

    constructor(socket, config, logger) {
        super(encoder);
        this.config = config;
        this.baseLogger = logger;
        this.logger = logger;
        this.socket = socket;
        this.keepalive = undefined;

        this.setWriter(this.socket);

        const self = this;
        this.socket.on(`error`, function (err) {
            self.logger.error(err);
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
        this.on('data', (data) => this.onData(data));
    }

    _authenticate() {
        serverOperations.get('authentication.auth').send(this, this.config.client.auth);
    }

    _startKeepAlive(keep_alive_interval) {
        this.logger.info(`starting keep alive with interval ${keep_alive_interval}`);
        this.keepalive = setInterval(() => {
            serverOperations.get('general.keep_alive').send(this);
        }, keep_alive_interval);
    }

    _setSessionId(sessionId) {
        this.sessionId = sessionId;
        this.logger = this.logger.child(`sess-${sessionId}`);
    }

    onData(data) {
        // Validate input and drop invalid packets
        if (!data) return;
        if (!data.opCode) return;
        if (!data.parameters) return;
        if (!Array.isArray(data.parameters)) return;
        if (!clientOperations.isValidOpCode(data.opCode)) return;
        
        const operation = clientOperations.get(data.opCode);

        if (operation.authenticatedOnly) {
            if (!this.persistent.isAuthenticated) return;
        }

        try {
            operation.process(this, ...data.parameters);
        } catch (error) {
            this.logger.error(`error while processing opcode ${data.opCode}: ${error}`);
            this.logger.error(error);
        }
    }

    disconnect() {
        clearInterval(this.keepalive);
        this.socket.destroy();
        this.logger.warning('disconnected');
        this.logger = this.baseLogger;
    }
}

module.exports = Client;