module.exports = (Receiver) => class extends Receiver {
    constructor() {
        super({
            // Define schemas inline, or reference them by ID based on the
            // schemas in the `schemas` directory.
            //
            // See https://github.com/tdegrunt/jsonschema for more information
            // on JSON schemas.
            inputSchema: {
                type: 'object',
                properties: {
                    message: { type: 'string' }
                },
                required: ['message']
            }
        });
    }

    async onReceived(input) {
        // Input has already been validated at this point, so you can expect
        // it to match the inputSchema.
    }
};