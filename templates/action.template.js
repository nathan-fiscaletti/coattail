module.exports = class extends require(`{ACTION_PATH}`) {
    constructor() {
        super({
            // Define schemas inline, or reference them by ID based on the
            // schemas in the `schemas` directory.
            //
            // See https://github.com/tdegrunt/jsonschema for more information
            // on JSON schemas.
            inputSchema: '/MyInputSchema',
            outputSchema: '/MyOutputSchema'
        });
    }

    async perform(input) {
        // Return a response from your action.
        //
        // 1. Response must match the outputSchema.
        // 2. Input has already been validated at this point, so you can expect
        //    it to match the inputSchema.
        return {};
    }
};