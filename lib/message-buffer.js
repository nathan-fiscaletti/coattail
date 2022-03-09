// Thanks to Isaac Rowell for the following code.
// https://blog.irowell.io/blog/use-a-message-buffer-stack-to-handle-data/

class MessageBuffer {
    constructor(delimiter) {
        this.delimiter = delimiter;
        this.buffer = "";
    }

    clear() {

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