const tls = require(`tls`);
const net = require(`net`);
const EventEmitter = require("events");
const IO = require(`../io`);
const encoder = require(`../encoding`);

const clientOperations = require(`../protocol-loader`)('client');
const serverOperations = require(`../protocol-loader`)('server');

// each subscription contains all of the connection options
class Client extends IO {
    static connect(config) {
        let socket;

        if (config.client.tls.use_tls) {
            socket = tls.connect(config.client.port, config.client.host);
        } else {
            socket = net.connect(config.client.port, config.client.host);
        }

        return new Client(socket, config);
    }

    constructor(socket, config) {
        super(encoder);
        this.config = config;
        this.socket = socket;

        this.setWriter(this.socket);

        this.socket.on('connect', () => {
            this._authenticate();
        });
        this.socket.on('end', () => {
            console.log(`closed connection to ${this.config.client.host}:${this.config.client.port}`);
        });
        this.on('data', (data) => this.onData(data));
    }

    _authenticate() {
        serverOperations.get('authentication.auth').send(this, this.config.client.auth);
    }

    _startKeepAlive(keep_alive_interval) {
        console.log(`starting keep alive with interval ${keep_alive_interval}`);
        setInterval(() => {
            serverOperations.get('general.keep_alive').send(this);
        }, keep_alive_interval);
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
            console.log(`error while processing opcode ${data.opCode}: ${error}`);
            console.log(error);
        }
    }
}

module.exports = Client;