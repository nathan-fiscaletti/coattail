module.exports = class extends require(`../lib/action`) {
    constructor() {
        super({
            inputSchema: {
                type: 'object',
                properties: {
                    name: {type: 'string'}
                },
                required: ['name']
            },
            outputSchema: '/Person'
        });
    }

    async perform(input) {
        return {
            name: input.name,
            age: 26,
            physical: {
                height: 10,
                weight: 10
            }
        };
    }
};