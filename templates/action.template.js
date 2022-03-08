module.exports = (Action) => class extends Action {
    async perform(input) {
        // Perform action and return output.
        return { ...input };
    }
};