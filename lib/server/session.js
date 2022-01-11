const encoder = require(`../encoding`);
const IO = require(`../io`);

const serverOperations = require(`../protocol-loader`)('server');

class Session extends IO {
    constructor(config, id, stream) {
        super(encoder);
        this.setWriter(stream);

        this.config = config;
        this.id = id;
        this.stream = stream;
        this.persistent = {};
        this.lastKeepAliveAt = 0;
    }

    startMonitoringActivity() {
        const refreshIntervalId = setInterval(() => {
            if (Date.now() - this.lastKeepAliveAt >= this.config.server.keep_alive_interval * 5) {
                console.log(`session ${this.id} stopped responding, dropping.`);
                this.stream.end();
                clearInterval(refreshIntervalId);
            }
        }, this.config.server.keep_alive_interval);
    }

    listen() {
        this.lastKeepAliveAt = Date.now();
        this.stream.on('end', () => this.onEnd());
        this.on('data', (data) => this.onData(data));
    }

    onEnd() {
        if (this.persistent.isAuthenticated) {
            console.log(`authenticated session ${this.id} closed`);
        }
    }

    onData(data) {
        // Validate input and drop invalid packets
        if (!data) return;
        if (!data.opCode) return;
        if (!data.parameters) return;
        if (!Array.isArray(data.parameters)) return;
        if (!serverOperations.isValidOpCode(data.opCode)) return;
        
        const operation = serverOperations.get(data.opCode);

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

module.exports = Session;