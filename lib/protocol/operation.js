const Chain = require(`./chain`);
const Events = require(`../events`);

class Operation {
    constructor(type, direction, {opCode, chain, authenticatedOnly, data}={}) {
        if (this.constructor == Operation) {
            throw new Error('Abstract classes cannot be instantiated!');
        }

        this.type = type;
        this.direction = direction;
        this.opCode = opCode;
        this.chain = chain !== undefined ? new Chain(chain) : new Chain();
        this.authenticatedOnly = authenticatedOnly === undefined ? true : authenticatedOnly;
        this.data = data;
    }

    async handle(connection, ...params) {
        throw new Error('Abstract method!');
    }

    make(params) {
        return {
            chain: this.chain.continued(),
            type: this.type,
            opCode: this.opCode,
            parameters: params
        };
    }

    _send(connection, {onTerminated = undefined, onSent = undefined}={}) {
        if (connection.direction !== this.direction && this.direction != Operation.DIRECTION.BI_DIRECTIONAL) {
            throw new Error(`FATAL: Attempt to perform operation with op-code '${this.opCode}' with mismatched directions. ${connection.direction} is not ${this.direction}`);
        }

        if (this.chain.initiater === undefined) {
            this.chain.initiater = connection.initiater;
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
        if (this.type === Operation.TYPE.FIRE_AND_FORGET) {
            throw new Error('Operations with type FIRE_AND_FORGET cannot be terminated.');
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

Operation.TYPE = Object.freeze({
    
    // Indicates an operation that is the first operation in a chain of
    // operations. The corresponding chain must end with an operation that has
    // the TERMINAL operation type.
    INITIAL: 'INITIAL',
                                 
    // Indicates an operation that comes somewhere between an INITIAL operation
    // and a TERMINAL operation in an operation chain. Operations bearing this
    // operation type must be preceded on their operation chain by an operation
    // bearing the INITIAL operation type. They must also be succeeded by an
    // operation bearing the TERMINAL operation type.
    CONTINUATION: 'CONTINUATION',

    // Indicates an operation that comes at the end of an operation chain.
    // Operations bearing this operation type must be preceded on their operation
    // chain by an operation bearing the INITIAL operation type.
    TERMINAL: 'TERMINAL',

    // Indicates an operation that does not correlate to an operation chain.
    // These operations are simply sent and then forgotten. You cannot use the
    // `terminate()` action on operations bearing this operation type.
    FIRE_AND_FORGET: 'FIRE_AND_FORGET'

});

module.exports = Operation;