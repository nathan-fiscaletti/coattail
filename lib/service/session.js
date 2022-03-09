const encoder = require(`../encoding`);
const Connection = require(`../connection`);
const Operation = require(`../protocol/operation`);
const Initiater = require(`../protocol/initiater`);
const config = require(`../config`);

class Session extends Connection {
    constructor(service, id, socket) {
        super(
            service.logger.child(`sess-${id}`),
            Operation.DIRECTION.HOST_TO_CLIENT,
            encoder,
            socket,
            Initiater.HOST
        );

        const self = this;
        socket.on(`error`, function (err) {
            self.logger.error(err);
        });

        this.service = service;
        this.id = id;
        this.lastKeepAliveAt = 0;
    }

    notifyAuthenticated(token) {
        this.isAuthenticated = true;
        this.token = token;
        this.logger.info(`session ${this.id} (${this.socket.remoteAddress}) authenticated`);
    }

    startMonitoringActivity() {
        this.lastKeepAliveAt = Date.now();
        this.refreshIntervalId = setInterval(() => {
            if (Date.now() - this.lastKeepAliveAt >= config.get().service.keep_alive_interval * 5) {
                this.logger.warning(`session ${this.id} stopped responding, dropping.`);
                this.socket.end();
                if (this.refreshIntervalId) {
                    clearInterval(this.refreshIntervalId);
                    this.refreshIntervalId = undefined;
                }
            }
        }, config.get().service.keep_alive_interval);
    }

    listen() {
        this.startMonitoringActivity();
        this.socket.on('end', () => this.onEnd());
    }

    onEnd() {
        this.messageBuffer.clear();

        if (this.isAuthenticated) {
            this.logger.warning(`session ${this.id} closed`);
        }

        if (this.refreshIntervalId) {
            clearInterval(this.refreshIntervalId);
        }
    }
}

module.exports = Session;