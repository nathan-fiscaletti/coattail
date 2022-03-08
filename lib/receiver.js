class Receiver {
    constructor() {
        this.name = undefined;
    }

    async onReceived(input) {
        throw new Error(`Receiver subclass '${this.name || this.constructor.name}' must implement the abstract method 'onReceived(input)'`);
    }

    performWithInputValidation(input) {
        return this.onReceived(input);
    }
}

module.exports = Receiver;