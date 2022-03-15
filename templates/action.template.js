module.exports = (Coattail) => class extends Coattail.Action {
    async perform(input) {
        // Perform action and return output.
        return { ...input };
    }
};