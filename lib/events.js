const EventEmitter = require("events");

class CoattailEmitter extends EventEmitter {
    constructor() {
        super();
        this.CLIENT = {
            ACTION_QUEUED: 'client_action_queued'
        };
        this.PROTOCOL = {
            CHAIN_TERMINATED: 'chain_terminated'
        }
    }
}

var emitter;
module.exports = (() => {
    if (emitter === undefined) {
        emitter = new CoattailEmitter();
    }

    return emitter;
})();