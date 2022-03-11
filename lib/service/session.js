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
    }

    notifyAuthenticated(token) {
        this.isAuthenticated = true;
        this.token = token;
        this.logger.info(`session ${this.id} (${this.socket.remoteAddress}) authenticated`);
    }

    listen() {
        this.socket.on('end', () => this.onEnd());
    }

    onEnd() {
        this.messageBuffer.clear();

        if (this.isAuthenticated) {
            this.logger.warning(`session ${this.id} closed`);
        }
    }
}

module.exports = Session;