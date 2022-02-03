const { v4: uuidv4 } = require('uuid');

const Incremental = {
    nextSessionId: 0,
    getNextSessionId: function () {
        if (this.nextSessionId === 0xffffffff) {
            this.nextSessionId = 0;
        }

        this.nextSessionId += 1;
        return this.nextSessionId.toString(16).padStart(8, '0');
    }
};

const UUIDv4 = {
    getNextSessionId: () => uuidv4()
};

module.exports = { Incremental, UUIDv4 };