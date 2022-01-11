const EventEmitter = require(`events`);

class IO extends EventEmitter {
    constructor(encoder) {
        super();
        this.encoder = encoder;
    }

    setWriter(writer) {
        this.writer = writer;
        this.writer.on('data', (data) => this.receiver(data));
    }

    receiver(data) {
        let decoded;
        try {
            decoded = this.encoder.decode(data.toString());
        } catch (error) {
            return;
        }

        this.emit('data', decoded);
    }

    write(data, cb) {
        if (this.writer) {
            let encoded;
            try {
                encoded = this.encoder.encode(data);
            } catch (error) {
                throw error;
            }

            this.writer.write(encoded, cb);
        }
    }
}

module.exports = IO;