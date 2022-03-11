class MessageBuffer {
    constructor(delimiter) {
        this.delimiter = delimiter;
        this.buffer = "";
    }

    push(data) {
        this.buffer += data;
    }

    clear() {
        this.buffer = "";
    }

    hasMessage() {
        return this.buffer.includes(this.delimiter);
    }

    nextMessage() {
        const delimiterIndex = this.buffer.indexOf(this.delimiter);
        if (delimiterIndex !== -1) {
            const message = this.buffer.slice(0, delimiterIndex);
            this.buffer = this.buffer.replace(message + this.delimiter, "");
            return message;
        }
        return null;
    }

    async handleAllMessages(cb) {
        while(this.hasMessage()) {
            await cb(this.nextMessage());
        }
    }
}

module.exports = MessageBuffer;