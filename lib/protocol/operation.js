const Sequence = require(`./sequence`);
const Chain = require(`./chain`);
const Events = require(`../events`);

class Operation {
    constructor(sequenceType, direction, {opCode, chain, authenticatedOnly, data}={}) {
        if (this.constructor == Operation) {
            throw new Error('Abstract classes cannot be instantiated!');
        }

        this.sequenceType = sequenceType;
        this.direction = direction;
        this.opCode = opCode;
        this.chain = chain !== undefined ? new Chain({
            id: chain.id,
            sequence: new Sequence(chain.sequence)
        }) : new Chain();
        this.authenticatedOnly = authenticatedOnly === undefined ? true : authenticatedOnly;
        this.data = data;
    }

    async handle(connection, ...params) {
        throw new Error('Abstract method!');
    }

    make(params) {
        return {
            chain: this.chain.continued(this.sequenceType),
            opCode: this.opCode,
            parameters: params
        };
    }

    _send(connection, {onTerminated = undefined, onSent = undefined}={}) {
        if (connection.direction !== this.direction && this.direction != Operation.DIRECTION.BI_DIRECTIONAL) {
            throw new Error(`FATAL: Attempt to perform operation with op-code '${this.opCode}' with mismatched directions. ${connection.direction} is not ${this.direction}`);
        }

        if (this.chain.sequence.initiater === undefined) {
            this.chain.sequence.initiater = connection.initiater;
        }

        if (onTerminated) {
            Events.on(this.chain._terminatedEvent(), onTerminated);
        }

        connection.write(this.make(this.data), onSent);
    }

    send(connection, onSent) {
        this._send(connection, {onSent});
    }

    terminate(connection, onTerminated) {
        if (this.sequenceType === Sequence.TYPE.FIRE_AND_FORGET) {
            throw new Error('Operations with sequence type FIRE_AND_FORGET cannot be terminated.');
        }
        this._send(connection, {onTerminated});
    }

    vitals() {
        return JSON.parse(JSON.stringify(this));
    }
}

Operation.DIRECTION = Object.freeze({
    HOST_TO_CLIENT: 'HOST_TO_CLIENT',
    CLIENT_TO_HOST: 'CLIENT_TO_HOST',
    BI_DIRECTIONAL: 'BI_DIRECTIONAL'
});

module.exports = Operation;