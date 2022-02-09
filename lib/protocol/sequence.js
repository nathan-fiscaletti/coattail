class Sequence {
    constructor({initiater, id, type}={}) {
        this.initiater = initiater;
        this.id = id || 0;
        this.type = type || Sequence.TYPE.INITIAL;
    }

    next(type) {
        return new Sequence({
            initiater: this.initiater,
            id: this.id + 1,
            type
        });
    }
}

Sequence.TYPE = Object.freeze({
    // Has no parent, expects a termination eventually
    INITIAL: 'INITIAL',
    // Has a parent, expects a termination eventually
    CONTINUATION: 'CONTINUATION',
    // Has a parent, expects no termination
    TERMINAL: 'TERMINAL',
    // Does not correlate to a chain, cannot be terminated
    FIRE_AND_FORGET: 'FIRE_AND_FORGET'
});

module.exports = Sequence;