const { v4: uuid } = require('uuid');
const Sequence = require(`./sequence`);
const Operations = require(`.`);

class Chain {
    constructor({id, sequence}={id: undefined, sequence: undefined}) {
        this.id = id || uuid();
        this.sequence = new Sequence(sequence);
    }

    continued(sequenceType) {
        return new Chain({
            id: this.id, 
            sequence: this.sequence.next(sequenceType)
        });
    }

    op(name, data) {
        return Operations.get(name, {chain: this, ...data});
    }

    _terminatedEvent() {
        return `${this.id}_terminated`;
    }
}

module.exports = Chain;