const EventEmitter = require(`events`);
const Operation = require(`./protocol/operation`);
const Operations = require(`./protocol`);
const Events = require(`./events`);

class Connection extends EventEmitter {
    constructor(logger, direction, encoder, socket, initiater) {
        super();
        this.logger = logger;
        this.encoder = encoder;
        this.socket = socket;
        this.direction = direction;
        this.isAuthenticated = false;
        this.initiater = initiater;
        this.socket.on('data', async (data) => await this.receive(data));
    }

    async receive(data) {
        let decoded;
        try {
            decoded = this.encoder.decode(data.toString());
        } catch (error) {
            return;
        }

        if (!decoded) return;
        if (!decoded.chain) return;
        if (!decoded.opCode) return;
        if (!decoded.parameters) return;
        if (!Operations.isValidOpCode(decoded.opCode)) return;
        
        const operation = Operations.get(decoded.opCode, {
            chain: decoded.chain,
            ...decoded.parameters
        });
        if (operation.direction === Operation.DIRECTION.CLIENT_TO_HOST) {
            if (operation.authenticatedOnly) {
                if (!this.isAuthenticated) return;
            }
        }

        this.logger.incoming(decoded);

        try {
            await operation.handle(this);
            if (operation.type === Operation.TYPE.TERMINAL) {
                if (operation.chain.initiater === this.initiater) {
                    Events.emit(
                        operation.chain._terminatedEvent(),
                        operation.data
                    );
                } else {
                    decoded.chain.op('chain-terminated', {
                        results: operation.data
                    }).send(this).catch(_ => { /* discard */ });
                }
                Events.emit(Events.PROTOCOL.CHAIN_TERMINATED, operation.chain);
            }
        } catch (error) {
            this.logger.error(
                `error while processing opcode ${decoded.opCode}: ${error}`
            );
            this.logger.error(error.stack);
        }
    }

    write(data, cb) {
        if (this.socket) {
            this.logger.outgoing(data);

            let encoded;
            try {
                encoded = this.encoder.encode(data);
            } catch (error) {
                throw error;
            }

            this.socket.write(encoded, cb);
        }
    }
}

module.exports = Connection;