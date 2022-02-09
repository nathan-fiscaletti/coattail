const encoder = require(`../encoding`);
const Connection = require(`../connection`);
const Operation = require(`../protocol/operation`);
const Initiater = require(`../protocol/initiater`);
const Operations = require(`../protocol/protocol-loader`);

class Session extends Connection {
    constructor(config, server, id, socket) {
        super(
            server.logger.child(`sess-${id}`),
            Operation.DIRECTION.HOST_TO_CLIENT,
            encoder,
            socket,
            Initiater.HOST
        );

        const self = this;
        socket.on(`error`, function (err) {
            self.logger.error(err);
        });

        this.config = config;
        this.server = server;
        this.id = id;
        this.lastKeepAliveAt = 0;
    }

    notifyAuthenticated() {
        this.isAuthenticated = true;
        this.logger.info(`session ${this.id} authenticated`);
        this.startMonitoringActivity();
    }

    startMonitoringActivity() {
        const refreshIntervalId = setInterval(() => {
            if (Date.now() - this.lastKeepAliveAt >= this.config.server.keep_alive_interval * 5) {
                this.logger.warning(`session ${this.id} stopped responding, dropping.`);
                this.socket.end();
                clearInterval(refreshIntervalId);
            }
        }, this.config.server.keep_alive_interval);
    }

    listen() {
        this.lastKeepAliveAt = Date.now();
        this.socket.on('end', () => this.onEnd());
    }

    onEnd() {
        if (this.isAuthenticated) {
            this.logger.warning(`authenticated session ${this.id} closed`);
        }
    }
}

module.exports = Session;