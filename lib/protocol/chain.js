const { v4: uuid } = require('uuid');
const Operations = require(`.`);

class Chain {
    constructor({initiater, id, event_id}={}) {
        this.initiater = initiater;
        this.id = id || uuid();
        this.event_id = event_id === undefined ? 0 : event_id;
    }

    continued() {
        return new Chain({
            initiater: this.initiater,
            id: this.id, 
            event_id: this.event_id + 1
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